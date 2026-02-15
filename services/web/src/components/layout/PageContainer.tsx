import { motion } from 'framer-motion';

interface PageContainerProps {
  children: React.ReactNode;
  /** Optional max-width class (default: max-w-7xl) */
  maxWidth?: string;
  /** Optional extra padding (default: px-4 py-8 sm:px-6 lg:px-8) */
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1] as const,
};

export function PageContainer({
  children,
  maxWidth = 'max-w-7xl',
  className = '',
}: PageContainerProps): React.ReactElement {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={`mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 ${maxWidth} ${className}`}
      role="main"
    >
      {children}
    </motion.main>
  );
}
