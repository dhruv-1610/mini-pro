interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned action (e.g., link or button) */
  action?: React.ReactNode;
  /** Heading level (default: 2) */
  as?: 1 | 2 | 3;
}

const sizeClasses: Record<1 | 2 | 3, string> = {
  1: 'text-3xl font-bold tracking-tight sm:text-4xl',
  2: 'text-2xl font-bold tracking-tight sm:text-3xl',
  3: 'text-xl font-semibold tracking-tight sm:text-2xl',
};

export function SectionHeader({
  title,
  subtitle,
  action,
  as = 2,
}: SectionHeaderProps): React.ReactElement {
  const id = title.toLowerCase().replace(/\s+/g, '-');
  const headingProps = {
    className: `text-stone-900 ${sizeClasses[as]}`,
    id,
  };

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {as === 1 && <h1 {...headingProps}>{title}</h1>}
        {as === 2 && <h2 {...headingProps}>{title}</h2>}
        {as === 3 && <h3 {...headingProps}>{title}</h3>}
        {subtitle && <p className="mt-1 text-sm text-stone-500 sm:mt-0">{subtitle}</p>}
      </div>
      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}
