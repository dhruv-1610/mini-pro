import { useState, useEffect } from 'react';
import type { DashboardData } from '../lib/dashboard';

const MOCK_DASHBOARD: DashboardData = {
  bookedDrives: [
    {
      id: 'b1',
      driveId: 'd1',
      title: 'Cubbon Park Cleanup',
      date: '2025-02-20T09:00:00',
      location: 'Cubbon Park, Bengaluru',
      role: 'Volunteer',
      status: 'confirmed',
    },
    {
      id: 'b2',
      driveId: 'd2',
      title: 'Lalbagh Lake Shore',
      date: '2025-03-01T08:00:00',
      location: 'Lalbagh, Bengaluru',
      role: 'Coordinator',
      status: 'confirmed',
    },
  ],
  donations: [
    { id: 'don1', amount: 50000, driveTitle: 'Cubbon Park Cleanup', date: '2025-02-01', type: 'one-time' },
    { id: 'don2', amount: 10000, date: '2025-01-15', type: 'one-time' },
  ],
  volunteerHours: {
    totalHours: 24.5,
    thisMonth: 8,
    drivesAttended: 6,
  },
  badges: [
    { id: 'badge1', name: 'First Step', description: 'Joined your first drive', icon: 'leaf', earnedAt: '2024-11-01', tier: 'bronze' },
    { id: 'badge2', name: 'Eco Champion', description: '10+ hours volunteered', icon: 'trophy', earnedAt: '2025-01-10', tier: 'silver' },
    { id: 'badge3', name: 'Team Player', description: 'Coordinated 2 drives', icon: 'heart', earnedAt: '2025-02-01', tier: 'gold' },
  ],
  ranking: {
    position: 12,
    totalParticipants: 1240,
    tier: 'city',
    previousPosition: 18,
  },
};

const EMPTY_DASHBOARD: DashboardData = {
  bookedDrives: [],
  donations: [],
  volunteerHours: { totalHours: 0, thisMonth: 0, drivesAttended: 0 },
  badges: [],
  ranking: null,
};

/** Simulates API fetch; replace with real api.get('/api/dashboard') when backend is ready. */
export function useDashboardData(options?: { empty?: boolean }): {
  data: DashboardData;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const delay = 600;
    const timer = setTimeout(() => {
      if (!mounted) return;
      setData(options?.empty ? EMPTY_DASHBOARD : MOCK_DASHBOARD);
      setLoading(false);
    }, delay);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [options?.empty]);

  return { data, loading, error };
}
