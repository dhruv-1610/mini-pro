/** Admin dashboard domain types. */

export interface ReportToVerify {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'verified' | 'rejected';
  location: string;
  reportedAt: string;
  reporterName?: string;
}

export interface OrganizerToApprove {
  id: string;
  name: string;
  email: string;
  organization?: string;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ExpenseToVerify {
  id: string;
  driveId: string;
  driveTitle: string;
  category: string;
  amount: number; // paise
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string;
}

export interface ImpactSubmission {
  driveId: string;
  wasteCollectedKg: number;
  areaCleanedSqM: number;
  workHours: number;
  volunteerCount: number;
}

export interface AnalyticsOverview {
  drivesByMonth: { month: string; count: number }[];
  reportsByStatus: { status: string; count: number }[];
  totalVolunteerHours: number;
  totalWasteKg: number;
  activeDrives: number;
}

export interface CreateDriveInput {
  title: string;
  date: string;
  time: string;
  locationName: string;
  lat: number;
  lng: number;
  maxVolunteers: number;
  fundingGoal: number;
  description: string;
}
