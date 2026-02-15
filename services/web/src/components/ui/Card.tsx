import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  /** Enable hover elevation effect */
  hoverable?: boolean;
  /** Use softer shadow (default) */
  variant?: 'default' | 'elevated';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card(
    { children, hoverable = false, variant = 'default', className = '', ...props },
    ref
  ) {
    return (
      <motion.div
        ref={ref}
        whileHover={
          hoverable
            ? {
                y: -2,
                transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
              }
            : undefined
        }
        className={`
          rounded-2xl bg-white shadow-soft
          ${hoverable ? 'cursor-pointer' : ''}
          ${hoverable ? 'hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]' : ''}
          ${variant === 'elevated' ? 'shadow-[0_4px_12px_rgba(0,0,0,0.06)]' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
