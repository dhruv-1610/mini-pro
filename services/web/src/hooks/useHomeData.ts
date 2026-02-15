import { useState, useEffect } from 'react';
import { api, type DriveSummary, type MapReport, type MapDrive, type MapCleaned } from '../lib/api';

/** Default bbox for Bengaluru area */
const DEFAULT_BBOX = {
  lngMin: 77.4,
  lngMax: 77.8,
  latMin: 12.8,
  latMax: 13.2,
};

const bboxParams = () =>
  new URLSearchParams({
    lngMin: String(DEFAULT_BBOX.lngMin),
    lngMax: String(DEFAULT_BBOX.lngMax),
    latMin: String(DEFAULT_BBOX.latMin),
    latMax: String(DEFAULT_BBOX.latMax),
  });

export interface ImpactStats {
  wasteCollected: number;
  drivesCompleted: number;
  volunteers: number;
  fundsRaised: number;
}

const MOCK_STATS: ImpactStats = {
  wasteCollected: 12500,
  drivesCompleted: 48,
  volunteers: 1200,
  fundsRaised: 2450000,
};

export function useImpactStats(): { stats: ImpactStats; loading: boolean } {
  const [stats] = useState<ImpactStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 400);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return { stats, loading };
}

export function useActiveDrives(): {
  drives: DriveSummary[];
  loading: boolean;
  error: Error | null;
} {
  const [drives, setDrives] = useState<DriveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<{ drives: DriveSummary[] }>('/api/drives/active')
      .then((res) => {
        if (mounted) setDrives(res.data.drives ?? []);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load drives'));
          setDrives([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { drives, loading, error };
}

export function useMapData(): {
  reports: MapReport[];
  drives: MapDrive[];
  cleaned: MapCleaned[];
  loading: boolean;
} {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [drives, setDrives] = useState<MapDrive[]>([]);
  const [cleaned, setCleaned] = useState<MapCleaned[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = bboxParams().toString();
    Promise.all([
      api.get<{ reports: MapReport[] }>(`/api/map/reports?${params}`),
      api.get<{ drives: MapDrive[] }>(`/api/map/drives?${params}`),
      api.get<{ locations: MapCleaned[] }>(`/api/map/cleaned?${params}`),
    ])
      .then(([r, d, c]) => {
        setReports(r.data.reports ?? []);
        setDrives(d.data.drives ?? []);
        setCleaned(c.data.locations ?? []);
      })
      .catch(() => {
        setReports([]);
        setDrives([]);
        setCleaned([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { reports, drives, cleaned, loading };
}
