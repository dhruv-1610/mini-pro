import mongoose from 'mongoose';
import { Attendance } from '../../src/models/attendance.model';

/** Factory: returns minimal valid Attendance data. */
function validAttendanceData(): Record<string, unknown> {
  return {
    driveId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    qrCode: 'qr_drive123_user456_a1b2c3d4',
  };
}

describe('Attendance Model — Validation', () => {
  // ── Happy path ──────────────────────────────────────────────────────────
  it('should validate a complete valid attendance record', () => {
    const attendance = new Attendance(validAttendanceData());
    const err = attendance.validateSync();
    expect(err).toBeUndefined();
  });

  // ── Required fields ─────────────────────────────────────────────────────
  it('should require driveId', () => {
    const { driveId: _, ...data } = validAttendanceData();
    const err = new Attendance(data).validateSync();
    expect(err?.errors.driveId).toBeDefined();
  });

  it('should require userId', () => {
    const { userId: _, ...data } = validAttendanceData();
    const err = new Attendance(data).validateSync();
    expect(err?.errors.userId).toBeDefined();
  });

  it('should require qrCode', () => {
    const { qrCode: _, ...data } = validAttendanceData();
    const err = new Attendance(data).validateSync();
    expect(err?.errors.qrCode).toBeDefined();
  });

  // ── Status enum ─────────────────────────────────────────────────────────
  it('should default status to "registered"', () => {
    const attendance = new Attendance(validAttendanceData());
    expect(attendance.status).toBe('registered');
  });

  it('should accept valid status values', () => {
    for (const status of ['registered', 'checked_in', 'absent'] as const) {
      const attendance = new Attendance({ ...validAttendanceData(), status });
      expect(attendance.validateSync()).toBeUndefined();
    }
  });

  it('should reject an invalid status', () => {
    const data = { ...validAttendanceData(), status: 'late' };
    const err = new Attendance(data).validateSync();
    expect(err?.errors.status).toBeDefined();
  });

  // ── Optional fields ─────────────────────────────────────────────────────
  it('should accept a checkedInAt date', () => {
    const now = new Date();
    const attendance = new Attendance({ ...validAttendanceData(), checkedInAt: now });
    expect(attendance.validateSync()).toBeUndefined();
    expect(attendance.checkedInAt).toEqual(now);
  });

  it('should default checkedInAt to undefined', () => {
    const attendance = new Attendance(validAttendanceData());
    expect(attendance.checkedInAt).toBeUndefined();
  });
});
