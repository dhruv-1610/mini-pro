import { Schema, model, Document, Types } from 'mongoose';

// ── Interface ──────────────────────────────────────────────────────────────
export interface IImpact extends Document {
  driveId: Types.ObjectId;
  /** Waste collected in kg. */
  wasteCollected: number;
  /** Area cleaned in square meters. */
  areaCleaned: number;
  /** Total work hours. */
  workHours: number;
  submittedBy?: Types.ObjectId;
  submittedAt?: Date;
  /** When true, admin can edit even after submission. */
  adminOverride: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ─────────────────────────────────────────────────────────────────
const impactSchema = new Schema<IImpact>(
  {
    driveId: {
      type: Schema.Types.ObjectId,
      ref: 'Drive',
      required: [true, 'Drive reference is required'],
      unique: true,
    },
    wasteCollected: {
      type: Number,
      required: [true, 'Waste collected (kg) is required'],
      min: [0, 'Waste collected cannot be negative'],
    },
    areaCleaned: {
      type: Number,
      required: [true, 'Area cleaned (sq m) is required'],
      min: [0, 'Area cleaned cannot be negative'],
    },
    workHours: {
      type: Number,
      required: [true, 'Work hours is required'],
      min: [0, 'Work hours cannot be negative'],
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: {
      type: Date,
    },
    adminOverride: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────
impactSchema.index({ driveId: 1 }, { unique: true });

// ── Model ──────────────────────────────────────────────────────────────────
export const Impact = model<IImpact>('Impact', impactSchema);
