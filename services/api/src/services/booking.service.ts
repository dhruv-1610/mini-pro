import crypto from 'crypto';
import mongoose from 'mongoose';
import { Drive } from '../models/drive.model';
import { Attendance } from '../models/attendance.model';
import { User } from '../models/user.model';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors';

/** 24 hours in milliseconds. */
const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

// ── Book slot ──────────────────────────────────────────────────────────────

export interface BookSlotResult {
  attendance: Awaited<ReturnType<typeof Attendance.findById>>;
}

/**
 * Book ONE role for a drive. Uses atomic $inc for booked/waitlist.
 * User must have role = user. One booking per user per drive.
 */
export async function bookSlot(
  driveId: string,
  userId: string,
  role: string,
): Promise<BookSlotResult> {
  const driveObjectId = new mongoose.Types.ObjectId(driveId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(userObjectId);
  if (!user || user.role !== 'user') {
    throw new ForbiddenError('Only registered users (role=user) can book slots');
  }

  const existingAttendance = await Attendance.findOne({
    driveId: driveObjectId,
    userId: userObjectId,
  });
  if (existingAttendance) {
    throw new ConflictError('You already have a booking for this drive. One role per drive.');
  }

  const qrCode = crypto.randomUUID();

  // Escape role for $where (role is from enum, safe)
  const roleStr = JSON.stringify(role);

  // Try atomic inc for booked (capacity available). $where ensures booked < capacity.
  const bookedResult = await Drive.collection.findOneAndUpdate(
    {
      _id: driveObjectId,
      status: 'planned',
      date: { $gt: new Date() },
      requiredRoles: { $elemMatch: { role } },
      $where: `this.requiredRoles.some(function(r){ return r.role === ${roleStr} && r.booked < r.capacity; })`,
    },
    { $inc: { 'requiredRoles.$.booked': 1 } },
    { returnDocument: 'after' },
  );

  if (bookedResult) {
    const attendance = await Attendance.create({
      driveId: driveObjectId,
      userId: userObjectId,
      role,
      qrCode,
      status: 'booked',
    });
    return { attendance };
  }

  // Try atomic inc for waitlist (capacity full)
  const waitlistResult = await Drive.collection.findOneAndUpdate(
    {
      _id: driveObjectId,
      status: 'planned',
      date: { $gt: new Date() },
      'requiredRoles.role': role,
    },
    { $inc: { 'requiredRoles.$.waitlist': 1 } },
    { returnDocument: 'after' },
  );

  if (!waitlistResult) {
    const drive = await Drive.findById(driveObjectId);
    if (!drive) {
      throw new NotFoundError('Drive not found');
    }
    if (drive.status !== 'planned') {
      throw new BadRequestError('Booking only allowed for drives with status "planned"');
    }
    if (drive.date <= new Date()) {
      throw new BadRequestError('Cannot book for past drives');
    }
    const hasRole = drive.requiredRoles.some((r) => r.role === role);
    if (!hasRole) {
      throw new BadRequestError(`Role "${role}" does not exist in this drive`);
    }
    throw new BadRequestError('Drive not available for booking');
  }

  const attendance = await Attendance.create({
    driveId: driveObjectId,
    userId: userObjectId,
    role,
    qrCode,
    status: 'waitlisted',
  });
  return { attendance };
}

// ── Cancel booking ─────────────────────────────────────────────────────────

export interface CancelBookingResult {
  attendance: Awaited<ReturnType<typeof Attendance.findById>>;
}

/**
 * Cancel a booking. Must be > 24 hours before drive date.
 * Updates drive booked/waitlist counters and sets attendance.status = cancelled.
 */
export async function cancelBooking(
  driveId: string,
  userId: string,
): Promise<CancelBookingResult> {
  const driveObjectId = new mongoose.Types.ObjectId(driveId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const attendance = await Attendance.findOne({
    driveId: driveObjectId,
    userId: userObjectId,
  });

  if (!attendance) {
    throw new NotFoundError('No booking found for this drive');
  }

  if (attendance.status === 'cancelled') {
    throw new BadRequestError('Booking is already cancelled');
  }

  const drive = await Drive.findById(driveObjectId);
  if (!drive) {
    throw new NotFoundError('Drive not found');
  }

  const now = new Date();
  const driveDate = new Date(drive.date);
  if (driveDate.getTime() - now.getTime() < CANCELLATION_WINDOW_MS) {
    throw new BadRequestError(
      'Cancellation must be at least 24 hours before the drive date',
    );
  }

  const role = attendance.role;

  if (attendance.status === 'booked') {
    await Drive.updateOne(
      { _id: driveObjectId, 'requiredRoles.role': role },
      { $inc: { 'requiredRoles.$.booked': -1 } },
    );
  } else if (attendance.status === 'waitlisted') {
    await Drive.updateOne(
      { _id: driveObjectId, 'requiredRoles.role': role },
      { $inc: { 'requiredRoles.$.waitlist': -1 } },
    );
  }

  attendance.status = 'cancelled';
  await attendance.save();

  return { attendance };
}

// ── Check-in ───────────────────────────────────────────────────────────────

export interface CheckinResult {
  attendance: Awaited<ReturnType<typeof Attendance.findById>>;
}

/**
 * Admin or organizer checks in a volunteer by QR code.
 * QR valid only on drive date. Cannot check in twice.
 */
export async function checkIn(
  driveId: string,
  qrCode: string,
  _performedBy: string,
): Promise<CheckinResult> {
  const driveObjectId = new mongoose.Types.ObjectId(driveId);

  const drive = await Drive.findById(driveObjectId);
  if (!drive) {
    throw new NotFoundError('Drive not found');
  }

  const today = new Date();
  const driveDate = new Date(drive.date);
  const driveDateStr = driveDate.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  if (driveDateStr !== todayStr) {
    throw new BadRequestError('QR code is valid only on the drive date');
  }

  const attendance = await Attendance.findOne({
    driveId: driveObjectId,
    qrCode,
  });

  if (!attendance) {
    throw new NotFoundError('Invalid QR code');
  }

  if (attendance.status === 'checked_in') {
    throw new BadRequestError('Already checked in. QR can be scanned only once.');
  }

  if (attendance.status === 'cancelled') {
    throw new BadRequestError('Cannot check in a cancelled booking');
  }

  attendance.status = 'checked_in';
  attendance.checkedInAt = new Date();
  await attendance.save();

  return { attendance };
}
