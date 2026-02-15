import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapData } from '../../hooks/useHomeData';

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

export function MapPreview(): React.ReactElement {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { reports, drives, cleaned, loading } = useMapData();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: false,
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

    const markers: L.Marker[] = [];

    const redIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    const greenIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#22c55e;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    const blueIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    reports.forEach((r) => {
      const [lng, lat] = r.location.coordinates;
      const m = L.marker([lat, lng], { icon: redIcon }).addTo(map);
      markers.push(m);
    });

    drives.forEach((d) => {
      const [lng, lat] = d.location.coordinates;
      const m = L.marker([lat, lng], { icon: blueIcon }).addTo(map);
      markers.push(m);
    });

    cleaned.forEach((c) => {
      const [lng, lat] = c.location.coordinates;
      const m = L.marker([lat, lng], { icon: greenIcon }).addTo(map);
      markers.push(m);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [reports, drives, cleaned]);

  return (
    <section
      className="bg-white py-20 sm:py-28"
      aria-labelledby="map-preview-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h2
              id="map-preview-heading"
              className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl"
            >
              Explore the map
            </h2>
            <p className="mt-2 text-stone-600">
              Reported spots, active drives, and cleaned locations
            </p>
          </div>
          <Link
            to="/map"
            className="mt-4 inline-flex items-center text-sm font-medium text-primary-700 hover:text-primary-800 sm:mt-0"
          >
            Open full map
            <svg
              className="ml-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mt-8 overflow-hidden rounded-2xl border border-stone-200 shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
        >
          <div
            ref={mapRef}
            className="h-[320px] w-full sm:h-[400px]"
            aria-hidden
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100/80 rounded-2xl">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-4 flex flex-wrap gap-6 text-sm text-stone-500"
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Reported
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Active drives
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Cleaned
          </span>
        </motion.div>
      </div>
    </section>
  );
}
