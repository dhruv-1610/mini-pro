/** Dashboard domain types (API can be wired later). */

export interface BookedDrive {
  id: string;
  driveId: string;
  title: string;
  date: string;
  location: string;
  role: string;
  status: 'confirmed' | 'cancelled';
}

export interface DonationRecord {
  id: string;
  amount: number; // paise
  driveTitle?: string;
  date: string;
  type: 'one-time' | 'recurring';
}

export interface VolunteerHoursSummary {
  totalHours: number;
  thisMonth: number;
  drivesAttended: number;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: 'leaf' | 'star' | 'heart' | 'trophy' | 'flame' | 'shield';
  earnedAt: string;
  tier?: 'bronze' | 'silver' | 'gold';
}

export interface RankingInfo {
  position: number;
  totalParticipants: number;
  tier: 'local' | 'city' | 'global';
  previousPosition?: number;
}

export interface DashboardData {
  bookedDrives: BookedDrive[];
  donations: DonationRecord[];
  volunteerHours: VolunteerHoursSummary;
  badges: UserBadge[];
  ranking: RankingInfo | null;
}
