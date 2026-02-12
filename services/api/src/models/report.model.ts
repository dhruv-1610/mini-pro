import { Schema, model, Document, Types } from 'mongoose';

// ── Constants ──────────────────────────────────────────────────────────────
export const REPORT_SEVERITIES = ['low', 'medium', 'high'] as const;
export type ReportSeverity = (typeof REPORT_SEVERITIES)[number];

export const REPORT_STATUSES = ['reported', 'verified', 'drive_created', 'cleaned'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

// ── Interface ──────────────────────────────────────────────────────────────
export interface IReport extends Document {
  photoUrls: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  duplicates: Types.ObjectId[];
  createdBy: Types.ObjectId;
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

// ── Schema ─────────────────────────────────────────────────────────────────
const reportSchema = new Schema<IReport>(
  {
    photoUrls: {
      type: [String],
      validate: {
        validator: (v: string[]): boolean => v.length >= 1,
        message: 'At least one photo URL is required',
      },
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
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: { values: REPORT_SEVERITIES as unknown as string[], message: 'Severity must be low, medium, or high' },
      required: [true, 'Severity is required'],
    },
    status: {
      type: String,
      enum: { values: REPORT_STATUSES as unknown as string[], message: 'Invalid report status' },
      default: 'reported',
      required: true,
    },
    duplicates: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Report' }],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1 });
reportSchema.index({ createdBy: 1 });
reportSchema.index({ severity: 1, status: 1 });

// ── Model ──────────────────────────────────────────────────────────────────
export const Report = model<IReport>('Report', reportSchema);
