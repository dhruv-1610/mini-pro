import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { SidebarLayout, type SidebarNavItem } from '../components/layout/SidebarLayout';
import { useAuthUser } from '../stores/authStore';
import {
  UpcomingDrivesSection,
  DonationHistorySection,
  VolunteerHoursSection,
  BadgeDisplaySection,
  RankingSection,
} from '../components/dashboard';
import { useDashboardData } from '../hooks/useDashboardData';

const dashboardNavItems: SidebarNavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: <DashboardIcon /> },
  { to: '/drives', label: 'Drives', icon: <DrivesIcon /> },
  { to: '/map', label: 'Map', icon: <MapIcon /> },
];

function DashboardIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}
function DrivesIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function MapIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

export function DashboardPage(): React.ReactElement {
  const { data, loading } = useDashboardData();
  const user = useAuthUser();
  const displayName = user?.profile?.name || user?.email || 'User';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <SidebarLayout navItems={dashboardNavItems} title="Dashboard">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="space-y-10"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                Welcome, {displayName}
              </h1>
              <p className="mt-1 text-stone-600">
                Overview of your bookings, impact, and achievements.
              </p>
            </div>

            <UpcomingDrivesSection drives={data.bookedDrives} loading={loading} />
            <VolunteerHoursSection summary={data.volunteerHours} loading={loading} />
            <RankingSection ranking={data.ranking} loading={loading} />
            <BadgeDisplaySection badges={data.badges} loading={loading} />
            <DonationHistorySection donations={data.donations} loading={loading} />
          </motion.div>
        </SidebarLayout>
      </div>
    </div>
  );
}
