import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { SidebarLayout, type SidebarNavItem } from '../components/layout/SidebarLayout';
import {
  CreateDriveForm,
  VerifyReportsSection,
  ApproveOrganizersSection,
  ExpenseVerificationTable,
  ImpactSubmissionForm,
  AnalyticsOverviewCharts,
} from '../components/admin';
import { useAdminData } from '../hooks/useAdminData';

const adminNavItems: SidebarNavItem[] = [
  { to: '/admin#analytics', label: 'Analytics', icon: <ChartIcon /> },
  { to: '/admin#create-drive', label: 'Create drive', icon: <DriveIcon /> },
  { to: '/admin#verify-reports', label: 'Verify reports', icon: <ReportIcon /> },
  { to: '/admin#approve-organizers', label: 'Approve organizers', icon: <OrganizerIcon /> },
  { to: '/admin#expense-verification', label: 'Expenses', icon: <ExpenseIcon /> },
  { to: '/admin#impact-submission', label: 'Impact submission', icon: <ImpactIcon /> },
];

function ChartIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function DriveIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function ReportIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function OrganizerIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function ExpenseIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ImpactIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

export function AdminDashboardPage(): React.ReactElement {
  const {
    reports,
    organizers,
    expenses,
    analytics,
    updateReportStatus,
    updateOrganizerStatus,
    updateExpenseStatus,
  } = useAdminData();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <SidebarLayout navItems={adminNavItems} title="Admin">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="space-y-12 pb-12"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                Admin dashboard
              </h1>
              <p className="mt-1 text-stone-600">
                Manage drives, reports, organizers, expenses, and impact.
              </p>
            </div>

            <AnalyticsOverviewCharts analytics={analytics} />
            <CreateDriveForm />
            <VerifyReportsSection reports={reports} onVerify={(id) => updateReportStatus(id, 'verified')} onReject={(id) => updateReportStatus(id, 'rejected')} />
            <ApproveOrganizersSection organizers={organizers} onApprove={(id) => updateOrganizerStatus(id, 'approved')} onReject={(id) => updateOrganizerStatus(id, 'rejected')} />
            <ExpenseVerificationTable expenses={expenses} onApprove={(id) => updateExpenseStatus(id, 'approved')} onReject={(id) => updateExpenseStatus(id, 'rejected')} />
            <ImpactSubmissionForm />
          </motion.div>
        </SidebarLayout>
      </div>
    </div>
  );
}
