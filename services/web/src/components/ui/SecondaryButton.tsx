import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface SecondaryButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  function SecondaryButton(
    {
      children,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) {
    return (
      <motion.button
        ref={ref}
        type="button"
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ duration: 0.15 }}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-stone-200
          bg-white px-5 py-2.5 text-sm font-semibold text-stone-700
          hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-60
          ${className}
        `}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="h-4 w-4 animate-spin text-stone-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);
