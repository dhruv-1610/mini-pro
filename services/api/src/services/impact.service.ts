import mongoose from 'mongoose';
import { Drive } from '../models/drive.model';
import { Impact, IImpact } from '../models/impact.model';
import { Report } from '../models/report.model';
import { ActivityLog } from '../models/activityLog.model';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';

// ── Submit impact ───────────────────────────────────────────────────────────

export interface SubmitImpactInput {
  driveId: string;
  wasteCollected: number;
  areaCleaned: number;
  workHours: number;
  beforePhotoUrls: string[];
  afterPhotoUrls: string[];
  submittedBy: string;
}

/**
 * Submit impact for a drive (admin only).
 * - Drive must exist and not already completed
 * - Creates Impact record
 * - Updates drive.status → completed, report.status → cleaned
 * - Creates ActivityLog
 */
export async function submitImpact(input: SubmitImpactInput): Promise<IImpact> {
  const driveObjectId = new mongoose.Types.ObjectId(input.driveId);

  const drive = await Drive.findById(driveObjectId);
  if (!drive) {
    throw new NotFoundError('Drive not found');
  }

  const existingImpact = await Impact.findOne({ driveId: driveObjectId });
  if (existingImpact) {
    throw new ConflictError('Impact has already been submitted for this drive.');
  }

  if (drive.status === 'completed') {
    throw new BadRequestError('Drive is already completed. Impact has already been submitted.');
  }

  const impact = await Impact.create({
    driveId: driveObjectId,
    wasteCollected: input.wasteCollected,
    areaCleaned: input.areaCleaned,
    workHours: input.workHours,
    beforePhotos: input.beforePhotoUrls,
    afterPhotos: input.afterPhotoUrls,
    submittedBy: input.submittedBy,
    submittedAt: new Date(),
  });

  drive.status = 'completed';
  await drive.save();

  const report = await Report.findById(drive.reportId);
  if (report) {
    report.status = 'cleaned';
    await report.save();
  }

  await ActivityLog.create({
    entityType: 'Impact',
    entityId: impact._id,
    action: 'impact_submitted',
    performedBy: input.submittedBy,
  });

  return impact;
}
