import { forwardRef } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-stone-100 text-stone-700',
  primary: 'bg-primary-100 text-primary-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  outline: 'border border-stone-200 bg-transparent text-stone-600',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge(
    { children, variant = 'default', className = '', ...props },
    ref
  ) {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
          ${variantClasses[variant]}
          ${className}
        `}
        role="status"
        {...props}
      >
        {children}
      </span>
    );
  }
);
