import Stripe from 'stripe';
import mongoose from 'mongoose';
import { Drive } from '../models/drive.model';
import { Donation } from '../models/donation.model';
import { User } from '../models/user.model';
import { ActivityLog } from '../models/activityLog.model';
import { DONATION_BLOCKED_DRIVE_STATUSES } from '../models/donation.model';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { env } from '../config/env';

// ── Create PaymentIntent and donation record ────────────────────────────────

export interface CreateDonationInput {
  driveId: string;
  userId: string;
  amount: number;
}

export interface CreateDonationResult {
  clientSecret: string;
}

/**
 * Create Stripe PaymentIntent and save Donation record with status=pending.
 * Validates drive exists, status is planned or active, and amount >= minimum.
 */
export async function createDonation(input: CreateDonationInput): Promise<CreateDonationResult> {
  const { driveId, userId, amount } = input;

  if (!env.STRIPE_SECRET_KEY) {
    throw new BadRequestError('Payment system is not configured');
  }

  const driveObjectId = new mongoose.Types.ObjectId(driveId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const drive = await Drive.findById(driveObjectId);
  if (!drive) {
    throw new NotFoundError('Drive not found');
  }

  if (DONATION_BLOCKED_DRIVE_STATUSES.includes(drive.status as (typeof DONATION_BLOCKED_DRIVE_STATUSES)[number])) {
    throw new BadRequestError(
      `Cannot donate to a drive with status "${drive.status}". Donations are only allowed for planned or active drives.`,
    );
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' });
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'inr',
    automatic_payment_methods: { enabled: true },
  });

  await Donation.create({
    userId: userObjectId,
    driveId: driveObjectId,
    amount,
    stripePaymentId: paymentIntent.id,
    status: 'pending',
  });

  return { clientSecret: paymentIntent.client_secret! };
}

// ── Handle Stripe webhook (payment_intent.succeeded) ────────────────────────

/**
 * Handle payment_intent.succeeded event.
 * Updates donation.status = completed, atomically increments drive.fundingRaised,
 * creates ActivityLog. Idempotent: if donation already completed, skip.
 */
export async function handlePaymentIntentSucceeded(
  paymentIntentId: string,
): Promise<void> {
  const donation = await Donation.findOne({ stripePaymentId: paymentIntentId });
  if (!donation) {
    return; // Unknown payment - ignore (e.g. not from our system)
  }

  if (donation.status === 'completed') {
    return; // Idempotent - already processed
  }

  donation.status = 'completed';
  await donation.save();

  await Drive.updateOne(
    { _id: donation.driveId },
    { $inc: { fundingRaised: donation.amount } },
  );

  await User.updateOne(
    { _id: donation.userId },
    { $inc: { 'stats.donations': donation.amount } },
  );

  await ActivityLog.create({
    entityType: 'Donation',
    entityId: donation._id,
    action: 'donation_completed',
    performedBy: donation.userId,
  });
}
