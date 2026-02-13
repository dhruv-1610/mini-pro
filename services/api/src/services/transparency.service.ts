import mongoose from 'mongoose';
import { Drive } from '../models/drive.model';
import { Impact } from '../models/impact.model';
import { Expense } from '../models/expense.model';
import { Attendance } from '../models/attendance.model';
import { NotFoundError } from '../utils/errors';

export interface TransparencyResult {
  driveId: string;
  moneyCollected: number;
  totalVerifiedExpenses: number;
  categoryBreakdown: Record<string, number>;
  photos: { before: string[]; after: string[] };
  attendanceCount: number;
}

/**
 * Get transparency data for a drive using aggregation pipeline.
 * - moneyCollected = drive.fundingRaised
 * - totalVerifiedExpenses = sum of isVerified=true expenses
 * - categoryBreakdown = verified expenses grouped by category
 * - photos = before + after from impact
 * - attendanceCount = count of attendance with status checked_in
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

  const [expenseAgg, totalVerifiedResult, attendanceCount] = await Promise.all([
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { driveId: driveObjectId, isVerified: true } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate<{ total: number }>([
      { $match: { driveId: driveObjectId, isVerified: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Attendance.countDocuments({ driveId: driveObjectId, status: 'checked_in' }),
  ]);

  const categoryBreakdown: Record<string, number> = {};
  for (const row of expenseAgg) {
    categoryBreakdown[row._id] = row.total;
  }

  const totalVerifiedExpenses = totalVerifiedResult[0]?.total ?? 0;

  return {
    driveId: driveId.toString(),
    moneyCollected: drive.fundingRaised,
    totalVerifiedExpenses,
    categoryBreakdown,
    photos: {
      before: impact.beforePhotos ?? [],
      after: impact.afterPhotos ?? [],
    },
    attendanceCount,
  };
}
