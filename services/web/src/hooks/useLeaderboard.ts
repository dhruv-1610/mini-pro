import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { LeaderboardPeriod, LeaderboardType, DonorEntry, VolunteerEntry } from '../lib/leaderboard';

export function useLeaderboard(type: LeaderboardType, period: LeaderboardPeriod): {
  donors: DonorEntry[] | null;
  volunteers: VolunteerEntry[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [donors, setDonors] = useState<DonorEntry[] | null>(null);
  const [volunteers, setVolunteers] = useState<VolunteerEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ period });
    if (type === 'donors') {
      api
        .get<{ donors: DonorEntry[] }>(`/api/leaderboard/donors?${params}`)
        .then((res) => {
          setDonors(res.data.donors ?? []);
          setVolunteers(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error('Failed to load leaderboard'));
          setDonors([]);
        })
        .finally(() => setLoading(false));
    } else {
      api
        .get<{ volunteers: VolunteerEntry[] }>(`/api/leaderboard/volunteers?${params}`)
        .then((res) => {
          setVolunteers(res.data.volunteers ?? []);
          setDonors(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error('Failed to load leaderboard'));
          setVolunteers([]);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    refetch();
  }, [type, period]);

  return { donors, volunteers, loading, error, refetch };
}
