import crypto from 'crypto';
import mongoose from 'mongoose';
import { Attendance } from '../../src/models/attendance.model';

/** Valid UUID v4 for tests. */
const validUuidV4 = (): string => crypto.randomUUID();

/** Factory: returns minimal valid Attendance data with UUID v4 QR. */
function validAttendanceData(): Record<string, unknown> {
  return {
    driveId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    role: 'Cleaner' as const,
    qrCode: validUuidV4(),
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
    const { driveId: _d, ...data } = validAttendanceData();
    const err = new Attendance(data).validateSync();
    expect(err?.errors.driveId).toBeDefined();
  });

  it('should require userId', () => {
    const { userId: _u, ...data } = validAttendanceData();
    const err = new Attendance(data).validateSync();
    expect(err?.errors.userId).toBeDefined();
  });

  it('should require role', () => {
    const { role: _r, ...data } = validAttendanceData();
    const err = new Attendance(data).validateSync();
    expect(err?.errors.role).toBeDefined();
  });

  it('should require qrCode', () => {
    const { qrCode: _q, ...data } = validAttendanceData();
    const err = new Attendance(data).validateSync();
    expect(err?.errors.qrCode).toBeDefined();
  });

  // ── Role enum (DriveRole) ───────────────────────────────────────────────
  it('should reject invalid role', () => {
    const data = { ...validAttendanceData(), role: 'picker' };
    const err = new Attendance(data).validateSync();
    expect(err?.errors.role).toBeDefined();
  });

  it('should accept valid DriveRole values', () => {
    for (const role of ['Cleaner', 'Coordinator', 'Photographer', 'LogisticsHelper'] as const) {
      const attendance = new Attendance({ ...validAttendanceData(), role, qrCode: validUuidV4() });
      expect(attendance.validateSync()).toBeUndefined();
    }
  });

  // ── QR code must be UUID v4 ─────────────────────────────────────────────
  it('should reject non-UUID v4 qrCode', () => {
    const data = { ...validAttendanceData(), qrCode: 'not-a-uuid' };
    const err = new Attendance(data).validateSync();
    expect(err?.errors.qrCode).toBeDefined();
  });

  it('should reject UUID v3 as qrCode (must be v4)', () => {
    const data = { ...validAttendanceData(), qrCode: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' };
    const err = new Attendance(data).validateSync();
    expect(err?.errors.qrCode).toBeDefined();
  });

  // ── Status enum (booked, checked_in, cancelled) ─────────────────────────
  it('should default status to "booked"', () => {
    const attendance = new Attendance(validAttendanceData());
    expect(attendance.status).toBe('booked');
  });

  it('should accept valid status values', () => {
    for (const status of ['booked', 'checked_in', 'cancelled'] as const) {
      const attendance = new Attendance({ ...validAttendanceData(), status, qrCode: validUuidV4() });
      expect(attendance.validateSync()).toBeUndefined();
    }
  });

  it('should reject an invalid status', () => {
    const data = { ...validAttendanceData(), status: 'registered' };
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
