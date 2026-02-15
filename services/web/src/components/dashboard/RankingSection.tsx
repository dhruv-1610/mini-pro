import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { SectionHeader } from '../ui';
import { AnimatedStatCard } from './AnimatedStatCard';
import { EmptyState } from './EmptyState';
import { RankingSkeleton } from './DashboardSkeletons';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import type { RankingInfo } from '../../lib/dashboard';

interface RankingSectionProps {
  ranking: RankingInfo | null;
  loading: boolean;
}

const trophyIcon = (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14v4H5V3zm2 6h10v2H7V9zm-2 4h14v6H5v-6zm4 3h6v2H9v-2z" />
  </svg>
);

export function RankingSection({ ranking, loading }: RankingSectionProps): React.ReactElement {
  if (loading) {
    return (
      <section aria-labelledby="ranking-heading">
        <SectionHeader title="Ranking" as={3} />
        <div className="mt-4">
          <RankingSkeleton />
        </div>
      </section>
    );
  }

  if (!ranking) {
    return (
      <section aria-labelledby="ranking-heading">
        <SectionHeader title="Ranking" as={3} />
        <div className="mt-4">
          <EmptyState
            illustration="ranking"
            title="No ranking yet"
            description="Participate in drives to appear on the leaderboard."
          />
        </div>
      </section>
    );
  }

  const improved = ranking.previousPosition != null && ranking.position < ranking.previousPosition;

  return (
    <RankingContent ranking={ranking} improved={improved} trophyIcon={trophyIcon} />
  );
}

function RankingContent({
  ranking,
  improved,
  trophyIcon,
}: {
  ranking: RankingInfo;
  improved: boolean;
  trophyIcon: React.ReactNode;
}): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const { count } = useAnimatedCounter({
    end: ranking.position,
    duration: 1000,
    startOnView: true,
  });

  return (
    <section aria-labelledby="ranking-heading">
      <SectionHeader
        title="Ranking"
        subtitle={`${ranking.tier} leaderboard`}
        as={3}
      />
      <div className="mt-4" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-stretch"
        >
          <div className="flex flex-1 items-center gap-4 rounded-2xl border border-stone-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
              {trophyIcon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-3xl font-bold text-stone-900" aria-live="polite">
                #{count}
              </p>
              <p className="text-sm text-stone-500">
                out of {ranking.totalParticipants.toLocaleString('en-IN')} participants
              </p>
              {improved && ranking.previousPosition != null && (
                <p className="mt-1 text-xs font-medium text-green-600">
                  ↑ Up from #{ranking.previousPosition}
                </p>
              )}
            </div>
          </div>
          <AnimatedStatCard
            value={ranking.totalParticipants}
            label="Total on leaderboard"
            delay={0.08}
            className="sm:max-w-[200px]"
          />
        </motion.div>
      </div>
    </section>
  );
}
