import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useLeaderboard } from '../hooks/useLeaderboard';
import {
  type LeaderboardType,
  type LeaderboardPeriod,
  type DonorEntry,
  type VolunteerEntry,
  formatDonorAmount,
  displayName,
} from '../lib/leaderboard';

const listTransition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

function MedalIcon({ rank }: { rank: number }): React.ReactElement {
  if (rank === 1) {
    return (
      <span className="text-2xl" aria-hidden>🥇</span>
    );
  }
  if (rank === 2) {
    return (
      <span className="text-2xl" aria-hidden>🥈</span>
    );
  }
  if (rank === 3) {
    return (
      <span className="text-2xl" aria-hidden>🥉</span>
    );
  }
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-stone-600">
      {rank}
    </span>
  );
}

function DonorCard({
  entry,
  rank,
}: {
  entry: DonorEntry;
  rank: number;
}): React.ReactElement {
  const isTopThree = rank <= 3;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ ...listTransition, delay: (rank - 1) * 0.04 }}
      className={`
        flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]
        transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
        ${isTopThree ? 'border-primary-200/80 ring-2 ring-primary-100 ring-offset-2' : 'border-stone-100'}
        ${rank === 1 ? 'shadow-[0_0_24px_rgba(22,101,52,0.12)]' : ''}
        ${rank === 2 ? 'shadow-[0_0_20px_rgba(120,113,108,0.1)]' : ''}
        ${rank === 3 ? 'shadow-[0_0_20px_rgba(180,83,9,0.1)]' : ''}
      `}
    >
      <MedalIcon rank={rank} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-stone-900 truncate">{displayName(entry.user)}</p>
        <p className="text-sm text-stone-500">Total donated</p>
      </div>
      <p className="flex-shrink-0 text-lg font-bold text-primary-700">{formatDonorAmount(entry.totalAmount)}</p>
    </motion.article>
  );
}

function VolunteerCard({
  entry,
  rank,
}: {
  entry: VolunteerEntry;
  rank: number;
}): React.ReactElement {
  const isTopThree = rank <= 3;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ ...listTransition, delay: (rank - 1) * 0.04 }}
      className={`
        flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]
        transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
        ${isTopThree ? 'border-primary-200/80 ring-2 ring-primary-100 ring-offset-2' : 'border-stone-100'}
        ${rank === 1 ? 'shadow-[0_0_24px_rgba(22,101,52,0.12)]' : ''}
        ${rank === 2 ? 'shadow-[0_0_20px_rgba(120,113,108,0.1)]' : ''}
        ${rank === 3 ? 'shadow-[0_0_20px_rgba(180,83,9,0.1)]' : ''}
      `}
    >
      <MedalIcon rank={rank} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-stone-900 truncate">{displayName(entry.user)}</p>
        <p className="text-sm text-stone-500">Drives attended</p>
      </div>
      <p className="flex-shrink-0 text-lg font-bold text-primary-700">{entry.driveCount} drives</p>
    </motion.article>
  );
}

export function LeaderboardPage(): React.ReactElement {
  const [type, setType] = useState<LeaderboardType>('donors');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');

  const { donors, volunteers, loading, error, refetch } = useLeaderboard(type, period);

  const list = type === 'donors' ? (donors ?? []) : (volunteers ?? []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <main className="flex flex-1 pt-16">
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-stone-900">Leaderboard</h1>
              <p className="mt-1 text-stone-600">Celebrating our top donors and volunteers</p>
            </div>

            {/* Toggle: Top Donors / Top Volunteers */}
            <div className="flex rounded-2xl bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <button
                type="button"
                onClick={() => setType('donors')}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  type === 'donors' ? 'bg-primary-700 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                Top Donors
              </button>
              <button
                type="button"
                onClick={() => setType('volunteers')}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  type === 'volunteers' ? 'bg-primary-700 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                Top Volunteers
              </button>
            </div>

            {/* Monthly / All-time switch */}
            <div className="flex items-center justify-center gap-2">
              <span className={`text-sm font-medium ${period === 'all-time' ? 'text-primary-700' : 'text-stone-500'}`}>
                All-time
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={period === 'monthly'}
                onClick={() => setPeriod((p) => (p === 'all-time' ? 'monthly' : 'all-time'))}
                className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  period === 'monthly' ? 'bg-primary-600' : 'bg-stone-200'
                }`}
              >
                <motion.span
                  animate={{ x: period === 'monthly' ? 24 : 0 }}
                  transition={listTransition}
                  className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm"
                />
              </button>
              <span className={`text-sm font-medium ${period === 'monthly' ? 'text-primary-700' : 'text-stone-500'}`}>
                This month
              </span>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-800"
              >
                {error.message}
                <button type="button" onClick={() => refetch()} className="ml-2 font-medium underline">
                  Retry
                </button>
              </motion.div>
            )}

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  />
                ))}
              </div>
            )}

            {!loading && !error && (
              <AnimatePresence mode="popLayout">
                {list.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl bg-white p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  >
                    <p className="font-medium text-stone-600">No entries yet</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {type === 'donors'
                        ? 'Be the first to donate and appear here!'
                        : 'Join a drive and check in to appear here.'}
                    </p>
                  </motion.div>
                ) : (
                  <ul className="space-y-3">
                    {type === 'donors'
                      ? (list as DonorEntry[]).map((entry, i) => (
                          <li key={entry.user._id}>
                            <DonorCard entry={entry} rank={i + 1} />
                          </li>
                        ))
                      : (list as VolunteerEntry[]).map((entry, i) => (
                          <li key={entry.user._id}>
                            <VolunteerCard entry={entry} rank={i + 1} />
                          </li>
                        ))}
                  </ul>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
