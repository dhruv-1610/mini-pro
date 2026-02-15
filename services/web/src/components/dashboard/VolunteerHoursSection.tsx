import { SectionHeader } from '../ui';
import { AnimatedStatCard } from './AnimatedStatCard';
import { StatsCardsSkeleton } from './DashboardSkeletons';
import type { VolunteerHoursSummary } from '../../lib/dashboard';

interface VolunteerHoursSectionProps {
  summary: VolunteerHoursSummary;
  loading: boolean;
}

const clockIcon = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const calendarIcon = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const usersIcon = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export function VolunteerHoursSection({ summary, loading }: VolunteerHoursSectionProps): React.ReactElement {
  if (loading) {
    return (
      <section aria-labelledby="volunteer-hours-heading">
        <SectionHeader title="Volunteer hours summary" as={3} />
        <div className="mt-4">
          <StatsCardsSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="volunteer-hours-heading">
      <SectionHeader title="Volunteer hours summary" as={3} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatedStatCard
          value={summary.totalHours}
          label="Total hours"
          suffix=" hrs"
          decimals={1}
          delay={0}
          icon={clockIcon}
        />
        <AnimatedStatCard
          value={summary.thisMonth}
          label="This month"
          suffix=" hrs"
          decimals={1}
          delay={0.05}
          icon={calendarIcon}
        />
        <AnimatedStatCard
          value={summary.drivesAttended}
          label="Drives attended"
          delay={0.1}
          icon={usersIcon}
        />
      </div>
    </section>
  );
}
