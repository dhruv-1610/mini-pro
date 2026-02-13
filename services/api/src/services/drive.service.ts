import mongoose from 'mongoose';
import { Drive, IDrive, IRequiredRole } from '../models/drive.model';
import { Report } from '../models/report.model';
import { ActivityLog } from '../models/activityLog.model';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';

// ── Create drive ───────────────────────────────────────────────────────────

export interface CreateDriveInput {
  reportId: string;
  title: string;
  date: Date;
  fundingGoal: number;
  requiredRoles: { role: string; capacity: number }[];
  createdBy: string;
}

/**
 * Create a new drive (admin only).
 *
 * 1. Report must exist and status = verified
 * 2. Only one drive per report
 * 3. maxVolunteers = sum(requiredRoles.capacity)
 * 4. requiredRoles no duplicate roles (validated by Zod)
 * 5. Report status → drive_created
 * 6. ActivityLog entry created
 */
export async function createDrive(input: CreateDriveInput): Promise<IDrive> {
  const { reportId, title, date, fundingGoal, requiredRoles, createdBy } = input;

  const reportObjectId = new mongoose.Types.ObjectId(reportId);

  const report = await Report.findById(reportObjectId);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  const existingDrive = await Drive.findOne({ reportId: reportObjectId });
  if (existingDrive) {
    throw new ConflictError('A drive already exists for this report. Only one drive per report.');
  }

  if (report.status !== 'verified') {
    throw new BadRequestError(
      'Report must be verified before creating a drive. Only reports with status "verified" can be used.',
    );
  }

  const maxVolunteers = requiredRoles.reduce((acc, r) => acc + r.capacity, 0);

  const rolesForSchema: IRequiredRole[] = requiredRoles.map((r) => ({
    role: r.role as IRequiredRole['role'],
    capacity: r.capacity,
    booked: 0,
    waitlist: 0,
  }));

  const drive = await Drive.create({
    title,
    date,
    maxVolunteers,
    fundingGoal,
    requiredRoles: rolesForSchema,
    status: 'planned',
    reportId: reportObjectId,
    location: report.location,
  });

  report.status = 'drive_created';
  await report.save();

  await ActivityLog.create({
    entityType: 'Drive',
    entityId: drive._id,
    action: 'drive_created',
    performedBy: createdBy,
  });

  return drive;
}

// ── Get drive by id ────────────────────────────────────────────────────────

export async function getDriveById(driveId: string): Promise<IDrive> {
  const drive = await Drive.findById(driveId);
  if (!drive) {
    throw new NotFoundError('Drive not found');
  }
  return drive;
}

// ── Get active drives ──────────────────────────────────────────────────────

/**
 * Get drives with status planned or active.
 */
export async function getActiveDrives(): Promise<IDrive[]> {
  return Drive.find({ status: { $in: ['planned', 'active'] } }).sort({ date: 1 });
}
