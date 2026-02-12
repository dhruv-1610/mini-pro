import { Schema, model, Document, Types } from 'mongoose';

// ── Constants ──────────────────────────────────────────────────────────────
export const ATTENDANCE_STATUSES = ['registered', 'checked_in', 'absent'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

// ── Interface ──────────────────────────────────────────────────────────────
export interface IAttendance extends Document {
  driveId: Types.ObjectId;
  userId: Types.ObjectId;
  /** Unique QR token for attendance verification. */
  qrCode: string;
  /** Timestamp when QR was scanned (check-in time). */
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
    qrCode: {
      type: String,
      required: [true, 'QR code is required'],
      unique: true,
    },
    checkedInAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: { values: ATTENDANCE_STATUSES as unknown as string[], message: 'Invalid attendance status' },
      default: 'registered',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────
// One user can only register once per drive.
attendanceSchema.index({ driveId: 1, userId: 1 }, { unique: true });
// qrCode unique index is created by `unique: true` above.

// ── Model ──────────────────────────────────────────────────────────────────
export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
