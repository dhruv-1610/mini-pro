import { motion } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { Card } from '../ui/Card';
import type { AnalyticsOverview } from '../../lib/admin';

interface AnalyticsOverviewChartsProps {
  analytics: AnalyticsOverview;
}

const chartTransition = { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

export function AnalyticsOverviewCharts({ analytics }: AnalyticsOverviewChartsProps): React.ReactElement {
  const maxDrives = Math.max(...analytics.drivesByMonth.map((d) => d.count), 1);
  const maxReports = Math.max(...analytics.reportsByStatus.map((r) => r.count), 1);

  return (
    <motion.section
      id="analytics"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      aria-labelledby="analytics-heading"
    >
      <SectionHeader title="Analytics overview" subtitle="Key metrics at a glance" as={3} />
      <div className="mt-4 space-y-6">
        {/* Summary stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Active drives', value: analytics.activeDrives, color: 'bg-primary-500' },
            { label: 'Total volunteer hours', value: analytics.totalVolunteerHours.toLocaleString('en-IN'), color: 'bg-primary-500' },
            { label: 'Total waste (kg)', value: analytics.totalWasteKg.toLocaleString('en-IN'), color: 'bg-amber-500' },
            { label: 'Drives this period', value: analytics.drivesByMonth.reduce((a, d) => a + d.count, 0), color: 'bg-primary-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...chartTransition, delay: i * 0.06 }}
            >
              <Card className="p-4">
                <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
                <p className="text-sm font-medium text-stone-500">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Drives by month - bar chart */}
          <Card className="p-6">
            <h4 className="mb-4 text-sm font-semibold text-stone-700">Drives by month</h4>
            <div className="flex items-end justify-between gap-2">
              {analytics.drivesByMonth.map((d, i) => (
                <div key={d.month} className="flex flex-1 flex-col items-center">
                  <div className="h-28 w-full max-w-12 flex justify-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.count / maxDrives) * 100}%` }}
                      transition={{ ...chartTransition, delay: 0.1 + i * 0.05 }}
                      className="w-full rounded-t-lg bg-primary-500 min-h-[4px]"
                    />
                  </div>
                  <span className="mt-2 text-xs font-medium text-stone-600">{d.month}</span>
                  <span className="text-xs text-stone-400">{d.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Reports by status - horizontal bars */}
          <Card className="p-6">
            <h4 className="mb-4 text-sm font-semibold text-stone-700">Reports by status</h4>
            <div className="space-y-3">
              {analytics.reportsByStatus.map((r, i) => (
                <div key={r.status}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-stone-600">{r.status}</span>
                    <span className="text-stone-500">{r.count}</span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(r.count / maxReports) * 100}%` }}
                    transition={{ ...chartTransition, delay: 0.2 + i * 0.08 }}
                    className="h-3 rounded-full bg-primary-500"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.section>
  );
}
