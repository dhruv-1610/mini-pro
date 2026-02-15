import { useState, useCallback } from 'react';
import type {
  ReportToVerify,
  OrganizerToApprove,
  ExpenseToVerify,
  AnalyticsOverview,
} from '../lib/admin';

const MOCK_REPORTS: ReportToVerify[] = [
  { id: 'r1', description: 'Plastic waste near lake shore', severity: 'high', status: 'pending', location: 'Lalbagh Lake', reportedAt: '2025-02-10T14:00:00', reporterName: 'Anonymous' },
  { id: 'r2', description: 'Litter in park corner', severity: 'low', status: 'pending', location: 'Cubbon Park', reportedAt: '2025-02-11T09:30:00', reporterName: 'Jane D.' },
  { id: 'r3', description: 'Dumping in vacant lot', severity: 'medium', status: 'verified', location: 'HSR Layout', reportedAt: '2025-02-09T11:00:00' },
];

const MOCK_ORGANIZERS: OrganizerToApprove[] = [
  { id: 'o1', name: 'Eco Warriors NGO', email: 'contact@ecowarriors.org', organization: 'Eco Warriors', appliedAt: '2025-02-01', status: 'pending' },
  { id: 'o2', name: 'Rahul S.', email: 'rahul@example.com', appliedAt: '2025-02-05', status: 'pending' },
  { id: 'o3', name: 'Green City Trust', email: 'info@greencity.org', organization: 'Green City Trust', appliedAt: '2025-01-28', status: 'approved' },
];

const MOCK_EXPENSES: ExpenseToVerify[] = [
  { id: 'e1', driveId: 'd1', driveTitle: 'Cubbon Park Cleanup', category: 'Supplies', amount: 50000, submittedBy: 'Lead Organizer', submittedAt: '2025-02-12', status: 'pending' },
  { id: 'e2', driveId: 'd2', driveTitle: 'Lalbagh Drive', category: 'Transport', amount: 25000, submittedBy: 'Rahul S.', submittedAt: '2025-02-11', status: 'approved' },
  { id: 'e3', driveId: 'd1', driveTitle: 'Cubbon Park Cleanup', category: 'Equipment', amount: 120000, submittedBy: 'Lead Organizer', submittedAt: '2025-02-10', status: 'rejected' },
];

const MOCK_ANALYTICS: AnalyticsOverview = {
  drivesByMonth: [
    { month: 'Oct', count: 4 },
    { month: 'Nov', count: 7 },
    { month: 'Dec', count: 6 },
    { month: 'Jan', count: 10 },
    { month: 'Feb', count: 8 },
  ],
  reportsByStatus: [
    { status: 'Pending', count: 12 },
    { status: 'Verified', count: 28 },
    { status: 'Rejected', count: 5 },
  ],
  totalVolunteerHours: 1240,
  totalWasteKg: 4850,
  activeDrives: 8,
};

export function useAdminData() {
  const [reports, setReports] = useState<ReportToVerify[]>(MOCK_REPORTS);
  const [organizers, setOrganizers] = useState<OrganizerToApprove[]>(MOCK_ORGANIZERS);
  const [expenses, setExpenses] = useState<ExpenseToVerify[]>(MOCK_EXPENSES);
  const [analytics] = useState<AnalyticsOverview>(MOCK_ANALYTICS);

  const updateReportStatus = useCallback((id: string, status: 'verified' | 'rejected') => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  const updateOrganizerStatus = useCallback((id: string, status: 'approved' | 'rejected') => {
    setOrganizers((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const updateExpenseStatus = useCallback((id: string, status: 'approved' | 'rejected') => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  }, []);

  return {
    reports,
    organizers,
    expenses,
    analytics,
    updateReportStatus,
    updateOrganizerStatus,
    updateExpenseStatus,
  };
}
