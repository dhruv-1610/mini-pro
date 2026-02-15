import { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Card } from '../ui/Card';
import type { ImpactSubmission } from '../../lib/admin';

const initialForm: ImpactSubmission = {
  driveId: '',
  wasteCollectedKg: 0,
  areaCleanedSqM: 0,
  workHours: 0,
  volunteerCount: 0,
};

export function ImpactSubmissionForm(): React.ReactElement {
  const [form, setForm] = useState<ImpactSubmission>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setForm(initialForm);
    }, 800);
  };

  const update = (key: keyof ImpactSubmission, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <motion.section
      id="impact-submission"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 }}
      aria-labelledby="impact-submission-heading"
    >
      <SectionHeader title="Impact submission" subtitle="Submit post-drive impact metrics" as={3} />
      <Card className="mt-4 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Drive ID</span>
            <input
              type="text"
              value={form.driveId}
              onChange={(e) => update('driveId', e.target.value)}
              className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. d1 or drive ID from completed drive"
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Waste collected (kg)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={form.wasteCollectedKg || ''}
                onChange={(e) => update('wasteCollectedKg', parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="0"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Area cleaned (m²)</span>
              <input
                type="number"
                min={0}
                value={form.areaCleanedSqM || ''}
                onChange={(e) => update('areaCleanedSqM', parseInt(e.target.value, 10) || 0)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="0"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Total work hours</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.workHours || ''}
                onChange={(e) => update('workHours', parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="0"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Volunteer count</span>
              <input
                type="number"
                min={0}
                value={form.volunteerCount || ''}
                onChange={(e) => update('volunteerCount', parseInt(e.target.value, 10) || 0)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="0"
              />
            </label>
          </div>
          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit" isLoading={submitting}>
              Submit impact
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </motion.section>
  );
}
