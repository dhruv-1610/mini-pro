import { Schema, model, Document, Types } from 'mongoose';

// ── Constants ──────────────────────────────────────────────────────────────
export const DRIVE_STATUSES = ['planned', 'active', 'completed', 'cancelled'] as const;
export type DriveStatus = (typeof DRIVE_STATUSES)[number];

// ── Sub-document interface ─────────────────────────────────────────────────
export interface IRequiredRole {
  role: string;
  slots: number;
  filled: number;
}

// ── Interface ──────────────────────────────────────────────────────────────
export interface IDrive extends Document {
  title: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  date: Date;
  maxVolunteers: number;
  /** Funding goal in smallest currency unit (cents for USD). */
  fundingGoal: number;
  /** Funding raised so far in smallest currency unit. */
  fundingRaised: number;
  requiredRoles: IRequiredRole[];
  status: DriveStatus;
  reportId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ── Coordinate validator ───────────────────────────────────────────────────
/** Validate GeoJSON Point coordinates: [longitude, latitude]. */
function validateCoordinates(this: void, val: number[]): boolean {
  return (
    val.length === 2 &&
    val[0] >= -180 &&
    val[0] <= 180 &&
    val[1] >= -90 &&
    val[1] <= 90
  );
}

// ── Required-role sub-schema ───────────────────────────────────────────────
const requiredRoleSchema = new Schema<IRequiredRole>(
  {
    role: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    slots: {
      type: Number,
      required: [true, 'Slot count is required'],
      min: [1, 'Slots must be at least 1'],
    },
    filled: {
      type: Number,
      default: 0,
      min: [0, 'Filled count cannot be negative'],
    },
  },
  { _id: false },
);

// ── Schema ─────────────────────────────────────────────────────────────────
const driveSchema = new Schema<IDrive>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: { values: ['Point'], message: 'Location type must be Point' },
        required: [true, 'Location type is required'],
      },
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates are required'],
        validate: {
          validator: validateCoordinates,
          message: 'Coordinates must be [longitude, latitude] with lng ∈ [-180,180] and lat ∈ [-90,90]',
        },
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    maxVolunteers: {
      type: Number,
      required: [true, 'Maximum volunteers is required'],
      min: [1, 'Must allow at least 1 volunteer'],
    },
    fundingGoal: {
      type: Number,
      required: [true, 'Funding goal is required'],
      min: [0, 'Funding goal cannot be negative'],
    },
    fundingRaised: {
      type: Number,
      default: 0,
      min: [0, 'Funding raised cannot be negative'],
    },
    requiredRoles: {
      type: [requiredRoleSchema],
      default: [],
    },
    status: {
      type: String,
      enum: { values: DRIVE_STATUSES as unknown as string[], message: 'Invalid drive status' },
      default: 'planned',
      required: true,
    },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'Report reference is required'],
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────
driveSchema.index({ location: '2dsphere' });
driveSchema.index({ status: 1 });
driveSchema.index({ reportId: 1 });
driveSchema.index({ date: 1 });

// ── Model ──────────────────────────────────────────────────────────────────
export const Drive = model<IDrive>('Drive', driveSchema);
