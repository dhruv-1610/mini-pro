import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Card } from '../ui/Card';
import { api } from '../../lib/api';

const DRIVE_ROLES = ['Cleaner', 'Coordinator', 'Photographer', 'LogisticsHelper'] as const;
const WIDE_BBOX = 'lngMin=68&lngMax=97&latMin=8&latMax=35';

interface VerifiedReport {
  _id: string;
  description?: string;
  severity?: string;
  status?: string;
}

export function CreateDriveForm(): React.ReactElement {
  const [reportId, setReportId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [fundingGoalRupees, setFundingGoalRupees] = useState(0);
  const [roleCapacities, setRoleCapacities] = useState<Record<string, number>>({
    Cleaner: 0,
    Coordinator: 0,
    Photographer: 0,
    LogisticsHelper: 0,
  });
  const [verifiedReports, setVerifiedReports] = useState<VerifiedReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .get<{ reports: VerifiedReport[] }>(`/api/map/verified?${WIDE_BBOX}`)
      .then((res) => setVerifiedReports(res.data.reports ?? []))
      .catch(() => setVerifiedReports([]))
      .finally(() => setLoadingReports(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const requiredRoles = DRIVE_ROLES.filter((r) => (roleCapacities[r] ?? 0) > 0).map((r) => ({
      role: r,
      capacity: roleCapacities[r],
    }));
    if (requiredRoles.length === 0) {
      setError('Add at least one role with capacity');
      return;
    }
    if (!reportId || !title || !date) {
      setError('Select a report, title and date');
      return;
    }
    const driveDate = new Date(date);
    if (driveDate <= new Date()) {
      setError('Drive date must be in the future');
      return;
    }
    setSubmitting(true);
    api
      .post('/api/drives', {
        reportId,
        title,
        date: driveDate.toISOString(),
        fundingGoal: fundingGoalRupees * 100,
        requiredRoles,
      })
      .then(() => {
        setSuccess(true);
        setReportId('');
        setTitle('');
        setDate('');
        setFundingGoalRupees(0);
        setRoleCapacities({ Cleaner: 0, Coordinator: 0, Photographer: 0, LogisticsHelper: 0 });
      })
      .catch((err: unknown) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
            : 'Failed to create drive';
        setError(typeof msg === 'string' ? msg : 'Failed to create drive');
      })
      .finally(() => setSubmitting(false));
  };

  const updateCapacity = (role: string, value: number) => {
    setRoleCapacities((prev) => ({ ...prev, [role]: Math.max(0, value) }));
  };

  return (
    <motion.section
      id="create-drive"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="create-drive-heading"
    >
      <SectionHeader title="Create drive" subtitle="Pick a verified report and schedule a cleanup drive" as={3} />
      <Card className="mt-4 p-6">
        {success && (
          <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            Drive created. It will appear on the Map (Active) and Drives list.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700">Verified report *</label>
            <select
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              required
              disabled={loadingReports}
              className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">{loadingReports ? 'Loading…' : 'Select a verified report'}</option>
              {verifiedReports.map((r) => (
                <option key={r._id} value={r._id}>
                  {(r.description ?? '').slice(0, 60)} {r.description && r.description.length > 60 ? '…' : ''} ({r._id.slice(-6)})
                </option>
              ))}
            </select>
            {!loadingReports && verifiedReports.length === 0 && (
              <p className="mt-1 text-xs text-stone-500">Verify a report from Map first (Reports → verify).</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cubbon Park Cleanup"
              required
              className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Drive date * (future)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Funding goal (₹)</label>
            <input
              type="number"
              min={0}
              value={fundingGoalRupees || ''}
              onChange={(e) => setFundingGoalRupees(parseInt(e.target.value, 10) || 0)}
              placeholder="0"
              className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-stone-700">Role capacities * (at least one)</span>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DRIVE_ROLES.map((role) => (
                <label key={role} className="block">
                  <span className="text-xs text-stone-500">{role}</span>
                  <input
                    type="number"
                    min={0}
                    value={roleCapacities[role] ?? 0}
                    onChange={(e) => updateCapacity(role, parseInt(e.target.value, 10) || 0)}
                    className="mt-0.5 block w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit" isLoading={submitting} disabled={loadingReports || verifiedReports.length === 0}>
              Create drive
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </motion.section>
  );
}
