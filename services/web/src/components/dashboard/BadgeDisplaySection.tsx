import { motion } from 'framer-motion';
import { SectionHeader } from '../ui';
import { EmptyState } from './EmptyState';
import { BadgeDisplaySkeleton } from './DashboardSkeletons';
import type { UserBadge } from '../../lib/dashboard';

interface BadgeDisplaySectionProps {
  badges: UserBadge[];
  loading: boolean;
}

const iconPaths: Record<UserBadge['icon'], string> = {
  leaf: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  trophy: 'M5 3h14v4H5V3zm2 6h10v2H7V9zm-2 4h14v6H5v-6zm4 3h6v2H9v-2z',
  flame: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
};

const tierColors: Record<NonNullable<UserBadge['tier']>, string> = {
  bronze: 'from-amber-200 to-amber-400 text-amber-900',
  silver: 'from-stone-200 to-stone-400 text-stone-800',
  gold: 'from-yellow-200 to-yellow-400 text-yellow-900',
};

function BadgeIcon({ icon, tier }: { icon: UserBadge['icon']; tier?: UserBadge['tier'] }): React.ReactElement {
  const gradient = tier ? tierColors[tier] : 'from-primary-200 to-primary-400 text-primary-900';
  return (
    <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient}`}>
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[icon]} />
      </svg>
    </div>
  );
}

export function BadgeDisplaySection({ badges, loading }: BadgeDisplaySectionProps): React.ReactElement {
  if (loading) {
    return (
      <section aria-labelledby="badges-heading">
        <SectionHeader title="Badges" as={3} />
        <div className="mt-4">
          <BadgeDisplaySkeleton />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="badges-heading">
      <SectionHeader
        title="Badges"
        subtitle={badges.length > 0 ? `${badges.length} earned` : undefined}
        as={3}
      />
      <div className="mt-4">
        {badges.length === 0 ? (
          <EmptyState
            illustration="badge"
            title="No badges yet"
            description="Complete drives and milestones to earn badges."
          />
        ) : (
          <div className="flex flex-wrap gap-6">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col items-center rounded-2xl border border-stone-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow"
              >
                <BadgeIcon icon={badge.icon} tier={badge.tier} />
                <p className="mt-2 text-sm font-semibold text-stone-900">{badge.name}</p>
                <p className="mt-0.5 max-w-[140px] text-center text-xs text-stone-500">{badge.description}</p>
                {badge.tier && (
                  <span className="mt-1 text-xs font-medium capitalize text-stone-500">{badge.tier}</span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
