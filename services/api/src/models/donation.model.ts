import { Schema, model, Document, Types } from 'mongoose';

// ── Constants ──────────────────────────────────────────────────────────────
export const DONATION_STATUSES = ['pending', 'completed', 'refunded'] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

/** Minimum donation: ₹10 = 1000 paise (smallest currency unit). */
export const DONATION_MIN_AMOUNT_PAISE = 1000;

/** Drive statuses where donation is NOT allowed (cleaned/completed or cancelled). */
export const DONATION_BLOCKED_DRIVE_STATUSES = ['completed', 'cancelled'] as const;

// ── Interface ──────────────────────────────────────────────────────────────
export interface IDonation extends Document {
  userId: Types.ObjectId;
  driveId: Types.ObjectId;
  /** Amount in paise (smallest INR unit). Min ₹10 = 1000 paise. */
  amount: number;
  /** Stripe Payment Intent ID — unique per donation. */
  stripePaymentId: string;
  receiptUrl?: string;
  status: DonationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ─────────────────────────────────────────────────────────────────
const donationSchema = new Schema<IDonation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    driveId: {
      type: Schema.Types.ObjectId,
      ref: 'Drive',
      required: [true, 'Drive reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [DONATION_MIN_AMOUNT_PAISE, 'Minimum donation is ₹10 (1000 paise)'],
    },
    stripePaymentId: {
      type: String,
      required: [true, 'Stripe payment ID is required'],
      unique: true,
    },
    receiptUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: { values: DONATION_STATUSES as unknown as string[], message: 'Invalid donation status' },
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────
donationSchema.index({ userId: 1 });
donationSchema.index({ driveId: 1 });

// ── Model ──────────────────────────────────────────────────────────────────
export const Donation = model<IDonation>('Donation', donationSchema);
