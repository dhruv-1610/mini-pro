import { Donation } from '../models/donation.model';
import { Attendance } from '../models/attendance.model';

export type LeaderboardPeriod = 'all-time' | 'monthly';

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get donor leaderboard - rank by total completed donations.
 * Tie-breaker: earliest user.createdAt.
 */
export async function getDonorLeaderboard(period: LeaderboardPeriod) {
  const matchStage: Record<string, unknown> = { status: 'completed' };
  if (period === 'monthly') {
    matchStage.createdAt = { $gte: startOfMonth(new Date()) };
  }

  const donors = await Donation.aggregate([
    { $match: matchStage },
    { $group: { _id: '$userId', totalAmount: { $sum: '$amount' } } },
    { $sort: { totalAmount: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDoc',
      },
    },
    { $unwind: '$userDoc' },
    { $sort: { totalAmount: -1, 'userDoc.createdAt': 1 } },
    {
      $project: {
        totalAmount: 1,
        user: {
          _id: '$userDoc._id',
          profile: '$userDoc.profile',
          createdAt: '$userDoc.createdAt',
        },
      },
    },
  ]);

  return donors;
}

/**
 * Get volunteer leaderboard - rank by checked_in count.
 * Tie-breaker: earliest user.createdAt.
 */
export async function getVolunteerLeaderboard(period: LeaderboardPeriod) {
  const matchStage: Record<string, unknown> = { status: 'checked_in' };
  if (period === 'monthly') {
    matchStage.checkedInAt = { $gte: startOfMonth(new Date()) };
  }

  const volunteers = await Attendance.aggregate([
    { $match: matchStage },
    { $group: { _id: '$userId', driveCount: { $sum: 1 } } },
    { $sort: { driveCount: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDoc',
      },
    },
    { $unwind: '$userDoc' },
    { $sort: { driveCount: -1, 'userDoc.createdAt': 1 } },
    {
      $project: {
        driveCount: 1,
        user: {
          _id: '$userDoc._id',
          profile: '$userDoc.profile',
          createdAt: '$userDoc.createdAt',
        },
      },
    },
  ]);

  return volunteers;
}
