import { Schema, model, Document, Types } from 'mongoose';

// ── Constants ──────────────────────────────────────────────────────────────
export const ACTIVITY_ENTITY_TYPES = [
  'Report',
  'Drive',
  'Booking',
  'Donation',
  'Impact',
] as const;
export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

export const ACTIVITY_ACTIONS = [
  'report_created',
  'report_verified',
  'drive_created',
  'booking_created',
  'donation_completed',
  'impact_submitted',
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

// ── Interface ──────────────────────────────────────────────────────────────
export interface IActivityLog extends Document {
  entityType: ActivityEntityType;
  entityId: Types.ObjectId;
  action: ActivityAction;
  performedBy: Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
}

// ── Schema ─────────────────────────────────────────────────────────────────
const activityLogSchema = new Schema<IActivityLog>(
  {
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: {
        values: ACTIVITY_ENTITY_TYPES as unknown as string[],
        message: 'Invalid entity type',
      },
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: {
        values: ACTIVITY_ACTIONS as unknown as string[],
        message: 'Invalid action',
      },
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed by is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────
activityLogSchema.index({ performedBy: 1, timestamp: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

// ── Model ──────────────────────────────────────────────────────────────────
export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);
