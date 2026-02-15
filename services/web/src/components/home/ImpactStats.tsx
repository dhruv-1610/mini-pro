import { motion, useInView } from 'framer-motion';
import { useImpactStats } from '../../hooks/useHomeData';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

function StatCard({
  value,
  label,
  suffix = '',
  prefix = '',
  decimals = 0,
  delay = 0,
}: {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  delay?: number;
}): React.ReactElement {
  const { count, ref } = useAnimatedCounter({
    end: value,
    duration: 1500,
    startOnView: true,
    decimals,
    suffix,
    prefix,
  });
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center rounded-2xl bg-white/80 px-6 py-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm"
    >
      <span
        className="text-3xl font-bold text-primary-700 sm:text-4xl"
        aria-live="polite"
      >
        {count}
      </span>
      <span className="mt-1 text-sm font-medium text-stone-600">{label}</span>
    </motion.div>
  );
}

export function ImpactStats(): React.ReactElement {
  const { stats, loading } = useImpactStats();

  if (loading) {
    return (
      <section
        className="relative -mt-16 px-4 pb-24 sm:px-6 lg:px-8"
        aria-label="Impact statistics"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-white/60"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative -mt-16 px-4 pb-24 sm:px-6 lg:px-8"
      aria-label="Impact statistics"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            value={stats.wasteCollected}
            label="Total Waste Collected (kg)"
            suffix=" kg"
            delay={0}
          />
          <StatCard
            value={stats.drivesCompleted}
            label="Drives Completed"
            delay={0.1}
          />
          <StatCard
            value={stats.volunteers}
            label="Total Volunteers"
            delay={0.2}
          />
          <StatCard
            value={Math.round(stats.fundsRaised / 100)}
            label="Funds Raised (₹)"
            prefix="₹"
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}
