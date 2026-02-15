import { motion } from 'framer-motion';
import { SectionHeader } from '../ui';
import { EmptyState } from './EmptyState';
import { DonationHistorySkeleton } from './DashboardSkeletons';
import type { DonationRecord } from '../../lib/dashboard';

interface DonationHistorySectionProps {
  donations: DonationRecord[];
  loading: boolean;
}

function formatAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export function DonationHistorySection({ donations, loading }: DonationHistorySectionProps): React.ReactElement {
  if (loading) {
    return (
      <section aria-labelledby="donation-history-heading">
        <SectionHeader title="Donation history" as={3} />
        <div className="mt-4">
          <DonationHistorySkeleton />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="donation-history-heading">
      <SectionHeader
        title="Donation history"
        subtitle={donations.length > 0 ? `Last ${donations.length} donation(s)` : undefined}
        as={3}
      />
      <div className="mt-4">
        {donations.length === 0 ? (
          <EmptyState
            illustration="donation"
            title="No donations yet"
            description="Your one-time or recurring donations to drives will appear here."
          />
        ) : (
          <ul className="space-y-2">
            {donations.map((donation, i) => (
              <motion.li
                key={donation.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-xl border border-stone-100 bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {donation.driveTitle ?? 'General donation'}
                  </p>
                  <p className="text-sm text-stone-500">
                    {new Date(donation.date).toLocaleDateString('en-IN')} · {donation.type}
                  </p>
                </div>
                <span className="font-semibold text-primary-700">{formatAmount(donation.amount)}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
