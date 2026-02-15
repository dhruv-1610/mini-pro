import { useState, useEffect, useCallback } from 'react';
import { api, type MapReport, type MapDrive, type MapCleaned } from '../lib/api';

export type MapPointType = 'reported' | 'verified' | 'active' | 'completed';

export interface MapPoint {
  id: string;
  type: MapPointType;
  coordinates: [number, number];
  data: MapReport | MapDrive | MapCleaned;
}

/** Wide default bbox (India) so drives/reports from most regions show on map. */
const DEFAULT_BBOX = {
  lngMin: 68,
  lngMax: 97,
  latMin: 8,
  latMax: 35,
};

function bboxParams() {
  return new URLSearchParams({
    lngMin: String(DEFAULT_BBOX.lngMin),
    lngMax: String(DEFAULT_BBOX.lngMax),
    latMin: String(DEFAULT_BBOX.latMin),
    latMax: String(DEFAULT_BBOX.latMax),
  });
}

export function useMapPageData(): {
  points: MapPoint[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [verified, setVerified] = useState<MapReport[]>([]);
  const [drives, setDrives] = useState<MapDrive[]>([]);
  const [cleaned, setCleaned] = useState<MapCleaned[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = bboxParams().toString();
    try {
      const [r, v, d, c] = await Promise.all([
        api.get<{ reports: MapReport[] }>(`/api/map/reports?${params}`),
        api.get<{ reports: MapReport[] }>(`/api/map/verified?${params}`),
        api.get<{ drives: MapDrive[] }>(`/api/map/drives?${params}`),
        api.get<{ locations: MapCleaned[] }>(`/api/map/cleaned?${params}`),
      ]);
      setReports(r.data.reports ?? []);
      setVerified(v.data.reports ?? []);
      setDrives(d.data.drives ?? []);
      setCleaned(c.data.locations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load map data'));
      setReports([]);
      setVerified([]);
      setDrives([]);
      setCleaned([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const points: MapPoint[] = [
    ...reports.map((d) => ({
      id: d._id,
      type: 'reported' as const,
      coordinates: d.location.coordinates as [number, number],
      data: d,
    })),
    ...verified.map((d) => ({
      id: d._id,
      type: 'verified' as const,
      coordinates: d.location.coordinates as [number, number],
      data: d,
    })),
    ...drives.map((d) => ({
      id: d._id,
      type: 'active' as const,
      coordinates: d.location.coordinates as [number, number],
      data: d,
    })),
    ...cleaned.map((d) => ({
      id: d._id,
      type: 'completed' as const,
      coordinates: d.location.coordinates as [number, number],
      data: d,
    })),
  ];

  return { points, loading, error, refetch: fetchData };
}
