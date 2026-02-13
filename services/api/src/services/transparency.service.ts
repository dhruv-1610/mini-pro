import mongoose from 'mongoose';
import { Drive } from '../models/drive.model';
import { Impact } from '../models/impact.model';
import { Expense } from '../models/expense.model';
import { Attendance } from '../models/attendance.model';
import { NotFoundError } from '../utils/errors';

export interface TransparencyResult {
  driveId: string;
  totalFunds: number;
  expenseBreakdown: Record<string, number>;
  photos: { before: string[]; after: string[] };
  volunteerCount: number;
  metrics: { wasteCollected: number; areaCleaned: number; workHours: number };
}

/**
 * Get transparency data for a drive using aggregation.
 * - totalFunds = drive.fundingRaised
 * - expenseBreakdown = verified expenses grouped by category
 * - photos = before + after from impact
 * - volunteerCount = count of attendance with status checked_in
 * - metrics = wasteCollected, areaCleaned, workHours from impact
 */
export async function getTransparency(driveId: string): Promise<TransparencyResult> {
  const driveObjectId = new mongoose.Types.ObjectId(driveId);

  const drive = await Drive.findById(driveObjectId);
  if (!drive) {
    throw new NotFoundError('Drive not found');
  }

  const impact = await Impact.findOne({ driveId: driveObjectId }).lean();
  if (!impact) {
    throw new NotFoundError('Impact not found for this drive');
  }

  const [expenseAgg, volunteerCount] = await Promise.all([
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { driveId: driveObjectId, isVerified: true } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
    Attendance.countDocuments({ driveId: driveObjectId, status: 'checked_in' }),
  ]);

  const expenseBreakdown: Record<string, number> = {};
  for (const row of expenseAgg) {
    expenseBreakdown[row._id] = row.total;
  }

  return {
    driveId: driveId.toString(),
    totalFunds: drive.fundingRaised,
    expenseBreakdown,
    photos: {
      before: impact.beforePhotos ?? [],
      after: impact.afterPhotos ?? [],
    },
    volunteerCount,
    metrics: {
      wasteCollected: impact.wasteCollected,
      areaCleaned: impact.areaCleaned,
      workHours: impact.workHours,
    },
  };
}
