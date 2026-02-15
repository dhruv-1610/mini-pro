import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SectionHeader } from '../ui';
import { EmptyState } from './EmptyState';
import { UpcomingDrivesSkeleton } from './DashboardSkeletons';
import type { BookedDrive } from '../../lib/dashboard';

interface UpcomingDrivesSectionProps {
  drives: BookedDrive[];
  loading: boolean;
}

function DriveIcon(): React.ReactElement {
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

export function UpcomingDrivesSection({ drives, loading }: UpcomingDrivesSectionProps): React.ReactElement {
  if (loading) {
    return (
      <section aria-labelledby="upcoming-drives-heading">
        <SectionHeader title="Upcoming booked drives" as={3} />
        <div className="mt-4">
          <UpcomingDrivesSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="upcoming-drives-heading">
      <SectionHeader
        title="Upcoming booked drives"
        subtitle={drives.length > 0 ? `${drives.length} drive(s) booked` : undefined}
        action={drives.length > 0 ? <Link to="/drives" className="text-sm font-medium text-primary-700 hover:underline">View all drives</Link> : undefined}
        as={3}
      />
      <div className="mt-4">
        {drives.length === 0 ? (
          <EmptyState
            illustration="calendar"
            title="No upcoming drives"
            description="Book a slot on an upcoming cleanup drive to see it here."
            action={<Link to="/drives" className="rounded-xl bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800">Browse drives</Link>}
          />
        ) : (
          <ul className="space-y-3">
            {drives.map((drive, i) => (
              <motion.li
                key={drive.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/drives/${drive.driveId}`}
                  className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                >
                  <DriveIcon />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900 truncate">{drive.title}</p>
                    <p className="text-sm text-stone-500">
                      {new Date(drive.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {drive.location}
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-800">
                    {drive.role}
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
