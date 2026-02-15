import { motion, useInView } from 'framer-motion';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

interface AnimatedStatCardProps {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  delay?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function AnimatedStatCard({
  value,
  label,
  suffix = '',
  prefix = '',
  decimals = 0,
  delay = 0,
  icon,
  className = '',
}: AnimatedStatCardProps): React.ReactElement {
  const { count, ref } = useAnimatedCounter({
    end: value,
    duration: 1200,
    startOnView: true,
    decimals,
    suffix,
    prefix,
  });
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className={`
        flex flex-col rounded-2xl border border-stone-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]
        transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
        ${className}
      `}
    >
      {icon && <div className="mb-2 text-primary-600">{icon}</div>}
      <span className="text-2xl font-bold text-stone-900 sm:text-3xl" aria-live="polite">
        {count}
      </span>
      <span className="mt-1 text-sm font-medium text-stone-500">{label}</span>
    </motion.div>
  );
}
