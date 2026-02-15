/** Leaderboard API types. */

export type LeaderboardPeriod = 'all-time' | 'monthly';
export type LeaderboardType = 'donors' | 'volunteers';

export interface LeaderboardUser {
  _id: string;
  profile?: { name?: string };
  createdAt?: string;
}

export interface DonorEntry {
  totalAmount: number; // paise
  user: LeaderboardUser;
}

export interface VolunteerEntry {
  driveCount: number;
  user: LeaderboardUser;
}

export function formatDonorAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export function displayName(user: LeaderboardUser): string {
  return user.profile?.name?.trim() || 'Anonymous';
}
