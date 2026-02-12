import { Schema, model, Document, Types } from 'mongoose';

// ── Constants ──────────────────────────────────────────────────────────────
export const DONATION_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

// ── Interface ──────────────────────────────────────────────────────────────
export interface IDonation extends Document {
  userId: Types.ObjectId;
  driveId: Types.ObjectId;
  /** Amount in smallest currency unit (cents for USD). */
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
      min: [1, 'Amount must be at least 1 (cent)'],
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
// stripePaymentId unique index is created by `unique: true` above.

// ── Model ──────────────────────────────────────────────────────────────────
export const Donation = model<IDonation>('Donation', donationSchema);
