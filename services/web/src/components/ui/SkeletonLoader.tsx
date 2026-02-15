import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  /** Tailwind width class (e.g. 'w-full', 'w-32') or inline px for number */
  width?: string;
  /** Tailwind height class (e.g. 'h-4', 'h-8') */
  height?: string;
  /** Use rounded corners */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

export function SkeletonLoader({
  width = '',
  height = 'h-4',
  rounded = 'md',
  className = '',
}: SkeletonLoaderProps): React.ReactElement {
  return (
    <motion.div
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`
        bg-stone-200
        ${roundedClasses[rounded]}
        ${width}
        ${height}
        ${className}
      `}
      role="presentation"
      aria-hidden
    />
  );
}

/** Preset skeleton for a card */
export function SkeletonCard(): React.ReactElement {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <SkeletonLoader width="w-2/3" height="h-5" className="mb-3" />
      <SkeletonLoader width="w-full" height="h-3.5" className="mb-2" />
      <SkeletonLoader width="w-4/5" height="h-3.5" className="mb-4" />
      <div className="flex gap-2">
        <SkeletonLoader width="w-20" height="h-8" rounded="lg" />
        <SkeletonLoader width="w-20" height="h-8" rounded="lg" />
      </div>
    </div>
  );
}
