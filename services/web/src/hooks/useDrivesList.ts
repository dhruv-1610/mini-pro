import { useState, useEffect } from 'react';
import { api, type DriveSummary } from '../lib/api';

export type DriveStatusFilter = 'all' | 'planned' | 'active' | 'completed';

export function useDrivesList(): {
  drives: DriveSummary[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [drives, setDrives] = useState<DriveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = () => {
    setLoading(true);
    setError(null);
    api
      .get<{ drives: DriveSummary[] }>('/api/drives')
      .then((res) => setDrives(res.data.drives ?? []))
      .catch((err) => {
        setError(err instanceof Error ? err : new Error('Failed to load drives'));
        setDrives([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();
  }, []);

  return { drives, loading, error, refetch };
}
