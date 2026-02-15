import { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { PrimaryButton } from '../ui/PrimaryButton';
import { Card } from '../ui/Card';
import type { CreateDriveInput } from '../../lib/admin';

const initialForm: CreateDriveInput = {
  title: '',
  date: '',
  time: '',
  locationName: '',
  lat: 0,
  lng: 0,
  maxVolunteers: 50,
  fundingGoal: 0,
  description: '',
};

export function CreateDriveForm(): React.ReactElement {
  const [form, setForm] = useState<CreateDriveInput>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setForm(initialForm);
    }, 800);
  };

  const update = (key: keyof CreateDriveInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <motion.section
      id="create-drive"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="create-drive-heading"
    >
      <SectionHeader title="Create drive" subtitle="Schedule a new cleanup drive" as={3} />
      <Card className="mt-4 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. Cubbon Park Cleanup"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Location name</span>
              <input
                type="text"
                value={form.locationName}
                onChange={(e) => update('locationName', e.target.value)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. Cubbon Park, Bengaluru"
                required
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Time</span>
              <input
                type="time"
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Coordinates (lat)</span>
              <input
                type="number"
                step="any"
                value={form.lat || ''}
                onChange={(e) => update('lat', e.target.value ? parseFloat(e.target.value) : 0)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="12.97"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Coordinates (lng)</span>
              <input
                type="number"
                step="any"
                value={form.lng || ''}
                onChange={(e) => update('lng', e.target.value ? parseFloat(e.target.value) : 0)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="77.59"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Max volunteers</span>
              <input
                type="number"
                min={1}
                value={form.maxVolunteers}
                onChange={(e) => update('maxVolunteers', parseInt(e.target.value, 10) || 0)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Funding goal (₹)</span>
              <input
                type="number"
                min={0}
                value={form.fundingGoal ? form.fundingGoal / 100 : ''}
                onChange={(e) => update('fundingGoal', (parseInt(e.target.value, 10) || 0) * 100)}
                className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="0"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Brief description of the drive..."
            />
          </label>
          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit" isLoading={submitting}>
              Create drive
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </motion.section>
  );
}
