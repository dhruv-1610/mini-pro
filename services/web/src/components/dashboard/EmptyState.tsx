import { motion } from 'framer-motion';

type IllustrationType = 'calendar' | 'donation' | 'volunteer' | 'badge' | 'ranking' | 'generic';

const illustrations: Record<IllustrationType, React.ReactNode> = {
  calendar: (
    <svg className="mx-auto h-24 w-24 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" opacity={0.6} />
    </svg>
  ),
  donation: (
    <svg className="mx-auto h-24 w-24 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  volunteer: (
    <svg className="mx-auto h-24 w-24 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6" opacity={0.6} />
    </svg>
  ),
  badge: (
    <svg className="mx-auto h-24 w-24 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  ranking: (
    <svg className="mx-auto h-24 w-24 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  generic: (
    <svg className="mx-auto h-24 w-24 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.5m-2.5 0h-5M15 8h-5m5 0V4" />
    </svg>
  ),
};

interface EmptyStateProps {
  illustration?: IllustrationType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  illustration = 'generic',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 py-12 px-6 text-center ${className}`}
    >
      {illustrations[illustration]}
      <h3 className="mt-4 text-base font-semibold text-stone-700">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
