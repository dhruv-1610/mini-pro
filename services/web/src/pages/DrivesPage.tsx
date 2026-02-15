import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { StatusTag, LoadingSpinner } from '../components/ui';
import { useDrivesList, type DriveStatusFilter } from '../hooks/useDrivesList';
import type { DriveSummary } from '../lib/api';

function DriveCard({ drive }: { drive: DriveSummary }): React.ReactElement {
  const raised = drive.fundingRaised ?? 0;
  const goal = drive.fundingGoal ?? 1;
  const progress = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
  const totalSlots = drive.requiredRoles?.reduce((a, r) => a + r.capacity, 0) ?? drive.maxVolunteers ?? 0;
  const booked = drive.requiredRoles?.reduce((a, r) => a + r.booked, 0) ?? 0;
  const slotsLeft = totalSlots - booked;
  const canBook = drive.status !== 'completed' && drive.status !== 'cancelled' && slotsLeft > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <StatusTag status={drive.status as 'planned' | 'active' | 'completed' | 'cancelled'} />
          <span className="text-sm text-stone-500">
            {new Date(drive.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        <h2 className="text-lg font-semibold text-stone-900">{drive.title}</h2>

        {goal > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-stone-600">
              <span>Funding</span>
              <span>
                ₹{(raised / 100).toLocaleString('en-IN')} / ₹{(goal / 100).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full bg-primary-500"
              />
            </div>
          </div>
        )}

        {totalSlots > 0 && (
          <p className="mt-3 text-sm text-stone-600">
            <span className="font-medium text-primary-700">{slotsLeft}</span>
            {' of '}
            <span>{totalSlots}</span>
            {' volunteer slots left'}
          </p>
        )}
      </div>

      <div className="border-t border-stone-100 p-4 sm:p-5">
        <Link
          to={`/drives/${drive._id}`}
          className={`block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
            canBook
              ? 'bg-primary-700 text-white hover:bg-primary-800'
              : 'bg-stone-100 text-stone-500 cursor-default'
          }`}
        >
          {canBook ? 'View & Book' : 'View details'}
        </Link>
      </div>
    </motion.article>
  );
}

export function DrivesPage(): React.ReactElement {
  const { drives, loading, error } = useDrivesList();
  const [statusFilter, setStatusFilter] = useState<DriveStatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSorted = useMemo(() => {
    let list = drives;
    if (statusFilter !== 'all') {
      list = list.filter((d) => d.status === statusFilter);
    }
    return [...list].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [drives, statusFilter, sortOrder]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">
              Drives
            </h1>
            <p className="mt-1 text-stone-600">
              Find cleanup drives and volunteer to make an impact.
            </p>

            {/* Filters */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(['all', 'planned', 'active', 'completed'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-primary-700 text-white'
                        : 'bg-white text-stone-600 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-stone-50'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-stone-600">
                  Sort:
                </label>
                <select
                  id="sort"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="asc">Date (earliest first)</option>
                  <option value="desc">Date (newest first)</option>
                </select>
              </div>
            </div>

            {loading && (
              <div className="mt-12 flex justify-center py-16">
                <LoadingSpinner size="lg" label="Loading drives" />
              </div>
            )}

            {error && (
              <div className="mt-12 rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">
                {error.message}
              </div>
            )}

            {!loading && !error && filteredAndSorted.length === 0 && (
              <div className="mt-12 rounded-2xl bg-white p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="text-lg font-medium text-stone-700">No drives found</p>
                <p className="mt-1 text-sm text-stone-500">
                  {statusFilter === 'all'
                    ? 'Check back later for upcoming cleanup drives.'
                    : 'Try a different filter.'}
                </p>
              </div>
            )}

            {!loading && !error && filteredAndSorted.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSorted.map((drive) => (
                  <DriveCard key={drive._id} drive={drive} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
