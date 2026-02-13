import { Schema, model, Document, Types } from 'mongoose';

// ── Constants ──────────────────────────────────────────────────────────────
export const DRIVE_STATUSES = ['planned', 'active', 'completed', 'cancelled'] as const;
export type DriveStatus = (typeof DRIVE_STATUSES)[number];

/** Drive-level role enum — user books ONE role per drive. */
export const DRIVE_ROLES = ['Cleaner', 'Coordinator', 'Photographer', 'LogisticsHelper'] as const;
export type DriveRole = (typeof DRIVE_ROLES)[number];

// ── Sub-document interface ─────────────────────────────────────────────────
export interface IRequiredRole {
  role: DriveRole;
  capacity: number;
  booked: number;
  waitlist: number;
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
  /** Funding goal in smallest currency unit (paise for INR). */
  fundingGoal: number;
  /** Funding raised so far in smallest currency unit. Updated ONLY after Stripe webhook success. */
  fundingRaised: number;
  /** Admin defines at drive creation. maxVolunteers must equal sum of capacity. */
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
      required: [true, 'Role is required'],
      enum: {
        values: DRIVE_ROLES as unknown as string[],
        message: 'Role must be Cleaner, Coordinator, Photographer, or LogisticsHelper',
      },
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    booked: {
      type: Number,
      default: 0,
      min: [0, 'Booked count cannot be negative'],
    },
    waitlist: {
      type: Number,
      default: 0,
      min: [0, 'Waitlist count cannot be negative'],
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
      required: [true, 'At least one required role must be defined at drive creation'],
      validate: {
        validator: (v: IRequiredRole[]): boolean => Array.isArray(v) && v.length >= 1,
        message: 'At least one required role is required',
      },
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

// ── maxVolunteers must equal sum of role capacities ─────────────────────────
driveSchema.path('requiredRoles').validate(function (roles: IRequiredRole[]) {
  if (!roles || roles.length === 0) return true;
  const sum = roles.reduce((acc, r) => acc + r.capacity, 0);
  return this.maxVolunteers === sum;
}, 'maxVolunteers must equal sum of role capacities');

// ── booked cannot exceed capacity per role (no overbooking) ─────────────────
driveSchema.path('requiredRoles').validate(function (roles: IRequiredRole[]) {
  if (!roles || roles.length === 0) return true;
  return roles.every((r) => (r.booked ?? 0) <= r.capacity);
}, 'booked cannot exceed capacity for any role');

// ── Indexes ────────────────────────────────────────────────────────────────
driveSchema.index({ location: '2dsphere' });
driveSchema.index({ status: 1 });
driveSchema.index({ reportId: 1 });
driveSchema.index({ date: 1 });

// ── Model ──────────────────────────────────────────────────────────────────
export const Drive = model<IDrive>('Drive', driveSchema);
