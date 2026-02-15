import { Badge } from './Badge';

export type StatusTagVariant =
  | 'reported'
  | 'verified'
  | 'drive_created'
  | 'planned'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'cleaned'
  | 'pending'
  | 'checked_in'
  | 'booked';

const statusConfig: Record<
  StatusTagVariant,
  { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline' }
> = {
  reported: { label: 'Reported', variant: 'default' },
  verified: { label: 'Verified', variant: 'primary' },
  drive_created: { label: 'Drive Created', variant: 'primary' },
  planned: { label: 'Planned', variant: 'primary' },
  active: { label: 'Active', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  cleaned: { label: 'Cleaned', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  checked_in: { label: 'Checked In', variant: 'success' },
  booked: { label: 'Booked', variant: 'outline' },
};

interface StatusTagProps {
  status: StatusTagVariant | string;
  /** Override display label */
  label?: string;
  className?: string;
}

export function StatusTag({ status, label, className = '' }: StatusTagProps): React.ReactElement {
  const config =
    statusConfig[status as StatusTagVariant] ??
    ({ label: String(status), variant: 'default' as const } as { label: string; variant: 'default' });

  return (
    <Badge variant={config.variant} className={className}>
      {label ?? config.label}
    </Badge>
  );
}
