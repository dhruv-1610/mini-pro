import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useActiveDrives } from '../../hooks/useHomeData';
import { StatusTag } from '../ui';

function DriveCard({
  drive,
  index,
}: {
  drive: {
    _id: string;
    title: string;
    date: string;
    status: string;
    fundingGoal?: number;
    fundingRaised?: number;
    maxVolunteers?: number;
    requiredRoles?: Array<{ booked: number; capacity: number }>;
  };
  index: number;
}): React.ReactElement {
  const raised = drive.fundingRaised ?? 0;
  const goal = drive.fundingGoal ?? 1;
  const progress = Math.min(100, (raised / goal) * 100);
  const totalSlots = drive.requiredRoles?.reduce((a, r) => a + r.capacity, 0) ?? drive.maxVolunteers ?? 0;
  const booked = drive.requiredRoles?.reduce((a, r) => a + r.booked, 0) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
    >
      <Link to={`/drives/${drive._id}`} className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center justify-between">
          <StatusTag status={drive.status as 'planned' | 'active'} />
          <span className="text-sm text-stone-500">
            {new Date(drive.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-stone-900">{drive.title}</h3>

        {goal > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-stone-600">
              <span>Funding</span>
              <span>
                ₹{(raised / 100).toLocaleString()} / ₹{(goal / 100).toLocaleString()}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="h-full rounded-full bg-primary-500"
              />
            </div>
          </div>
        )}

        {totalSlots > 0 && (
          <p className="mt-3 text-sm text-stone-600">
            <span className="font-medium text-primary-700">{booked}</span>
            <span> / {totalSlots} volunteer slots filled</span>
          </p>
        )}
      </Link>
    </motion.div>
  );
}

export function FeaturedDrivesCarousel(): React.ReactElement {
  const { drives, loading } = useActiveDrives();
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visible = drives.slice(0, 6);

  useEffect(() => {
    if (visible.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % visible.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible.length]);

  if (loading) {
    return (
      <section className="bg-stone-50 py-20 sm:py-28" aria-label="Featured drives">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 h-10 w-64 animate-pulse rounded bg-stone-200" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (visible.length === 0) {
    return (
      <section className="bg-stone-50 py-20 sm:py-28" aria-label="Featured drives">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Featured Drives
          </h2>
          <p className="mt-4 text-stone-600">No drives scheduled yet. Check back soon!</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-stone-50 py-20 sm:py-28"
      aria-label="Featured drives"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Featured Drives
            </h2>
            <p className="mt-2 text-stone-600">Upcoming community cleanup events</p>
          </div>
          <Link
            to="/drives"
            className="hidden text-sm font-medium text-primary-700 hover:text-primary-800 sm:block"
          >
            View all →
          </Link>
        </div>

        <div className="mt-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((drive, i) => (
              <DriveCard key={drive._id} drive={drive} index={i} />
            ))}
          </div>
        </div>

        {visible.length > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            {visible.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                setIndex(i);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === index % visible.length
                    ? 'w-6 bg-primary-600'
                    : 'w-2 bg-stone-300 hover:bg-stone-400'
                }`}
                aria-label={`Go to drive ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
