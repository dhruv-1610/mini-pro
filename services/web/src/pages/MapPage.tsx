import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { LoadingSpinner } from '../components/ui';
import { useMapPageData, type MapPoint, type MapPointType } from '../hooks/useMapPageData';

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

const MARKER_COLORS: Record<MapPointType, string> = {
  reported: '#ef4444',
  verified: '#f97316',
  active: '#3b82f6',
  completed: '#22c55e',
};

const STATUS_LABELS: Record<MapPointType, string> = {
  reported: 'Reported',
  verified: 'Verified',
  active: 'Active',
  completed: 'Completed',
};

function createMarkerIcon(type: MapPointType): L.DivIcon {
  const color = MARKER_COLORS[type];
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function DetailPanel({ point, onClose }: { point: MapPoint; onClose: () => void }): React.ReactElement {
  const { type, data } = point;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${MARKER_COLORS[type]}20`,
            color: MARKER_COLORS[type],
          }}
        >
          {STATUS_LABELS[type]}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
          aria-label="Close panel"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex-1 overflow-y-auto">
        {type === 'reported' || type === 'verified' ? (
          <div className="space-y-2">
            <p className="text-sm text-stone-600">
              {(data as { description?: string }).description ?? 'No description'}
            </p>
            <p className="text-xs text-stone-500">
              Severity: {(data as { severity?: string }).severity ?? '—'}
            </p>
          </div>
        ) : type === 'active' ? (
          <div className="space-y-2">
            <h3 className="font-semibold text-stone-900">{(data as { title?: string }).title ?? 'Drive'}</h3>
            {(data as { date?: string }).date && (
              <p className="text-sm text-stone-600">
                {new Date((data as { date: string }).date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            )}
            <Link
              to={`/drives/${data._id}`}
              className="inline-flex text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              View drive →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="font-semibold text-stone-900">{(data as { title?: string }).title ?? 'Cleaned'}</h3>
            {(data as { impactSummary?: { wasteCollected: number; areaCleaned: number; workHours: number } }).impactSummary && (
              <div className="text-sm text-stone-600">
                <p>Waste: {(data as { impactSummary: { wasteCollected: number } }).impactSummary.wasteCollected} kg</p>
                <p>Area: {(data as { impactSummary: { areaCleaned: number } }).impactSummary.areaCleaned} m²</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function MapPage(): React.ReactElement {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [statusFilter, setStatusFilter] = useState<Set<MapPointType>>(
    new Set(['reported', 'verified', 'active', 'completed'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const { points, loading, error, refetch } = useMapPageData();

  const filteredPoints = points.filter((p) => statusFilter.has(p.type));

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=1`
      );
      const data = await res.json();
      if (data?.[0] && mapInstanceRef.current) {
        const { lat, lon } = data[0];
        mapInstanceRef.current.setView([parseFloat(lat), parseFloat(lon)], 14);
      }
    } catch {
      // ignore
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredPoints.forEach((point) => {
      const [lng, lat] = point.coordinates;
      const marker = L.marker([lat, lng], {
        icon: createMarkerIcon(point.type),
      })
        .addTo(map)
        .on('click', () => setSelectedPoint(point));
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [filteredPoints]);

  const toggleFilter = (type: MapPointType) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <main className="flex flex-1 pt-16">
        <div className="relative flex flex-1 flex-col">
          {/* Controls overlay */}
          <div className="absolute left-4 top-20 z-[1000] flex w-full max-w-sm flex-col gap-3 sm:top-24">
            <div className="flex gap-2 rounded-xl bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <input
                type="search"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 rounded-lg border-0 bg-stone-50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                aria-label="Search by location"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searchLoading}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
              >
                {searchLoading ? '...' : 'Search'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              {(['reported', 'verified', 'active', 'completed'] as MapPointType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleFilter(type)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter.has(type)
                      ? 'text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                  style={
                    statusFilter.has(type)
                      ? { backgroundColor: MARKER_COLORS[type] }
                      : undefined
                  }
                >
                  {STATUS_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Map container */}
          <div className="relative h-[calc(100vh-4rem)] w-full min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 z-[900] flex items-center justify-center bg-stone-100/90">
                <LoadingSpinner size="lg" label="Loading map" />
              </div>
            )}
            {error && (
              <div className="absolute left-4 right-4 top-1/2 z-[900] -translate-y-1/2 rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">
                {error.message}
                <button
                  type="button"
                  onClick={refetch}
                  className="ml-2 font-medium underline"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && filteredPoints.length === 0 && (
              <div className="absolute inset-0 z-[900] flex items-center justify-center bg-stone-50/95">
                <div className="max-w-sm text-center">
                  <p className="text-lg font-medium text-stone-700">No points to show</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Try adjusting filters or check back later for new reports and drives.
                  </p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="h-full w-full" aria-label="Map" />
          </div>
        </div>

        {/* Sidebar panel */}
        <AnimatePresence>
          {selectedPoint && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[800] bg-stone-900/30 sm:hidden"
                onClick={() => setSelectedPoint(null)}
                aria-hidden
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="fixed right-0 top-16 z-[850] h-[calc(100vh-4rem)] w-full max-w-sm border-l border-stone-200 bg-white p-4 shadow-xl sm:max-w-md"
              >
                <DetailPanel point={selectedPoint} onClose={() => setSelectedPoint(null)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
