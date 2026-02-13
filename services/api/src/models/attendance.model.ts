import { Schema, model, Document, Types } from 'mongoose';
import { DRIVE_ROLES, DriveRole } from './drive.model';

// ── Constants ──────────────────────────────────────────────────────────────
export const ATTENDANCE_STATUSES = ['booked', 'checked_in', 'cancelled'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** UUID v4 regex for QR code validation. */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Interface ──────────────────────────────────────────────────────────────
export interface IAttendance extends Document {
  driveId: Types.ObjectId;
  userId: Types.ObjectId;
  /** Role booked for this drive. User can book ONLY ONE role per drive. */
  role: DriveRole;
  /** Random UUID v4 generated at booking time. Valid only on drive date. Scanned only once. */
  qrCode: string;
  /** Set when admin confirms check-in. */
  checkedInAt?: Date;
  status: AttendanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ─────────────────────────────────────────────────────────────────
const attendanceSchema = new Schema<IAttendance>(
  {
    driveId: {
      type: Schema.Types.ObjectId,
      ref: 'Drive',
      required: [true, 'Drive reference is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: DRIVE_ROLES as unknown as string[],
        message: 'Role must be Cleaner, Coordinator, Photographer, or LogisticsHelper',
      },
    },
    qrCode: {
      type: String,
      required: [true, 'QR code is required'],
      unique: true,
      validate: {
        validator: (v: string): boolean => UUID_V4_REGEX.test(v),
        message: 'QR code must be a valid UUID v4',
      },
    },
    checkedInAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ATTENDANCE_STATUSES as unknown as string[],
        message: 'Status must be booked, checked_in, or cancelled',
      },
      default: 'booked',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────
// One user can only book once per drive (one role per drive).
attendanceSchema.index({ driveId: 1, userId: 1 }, { unique: true });
attendanceSchema.index({ driveId: 1, role: 1 });
attendanceSchema.index({ qrCode: 1 }, { unique: true });

// ── Model ──────────────────────────────────────────────────────────────────
export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
