import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { Badge } from '../ui/Badge';
import { ConfirmModal } from '../ui/ConfirmModal';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import type { ReportToVerify } from '../../lib/admin';

interface VerifyReportsSectionProps {
  reports: ReportToVerify[];
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
}

const statusBadge = (status: ReportToVerify['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'verified':
      return <Badge variant="success">Verified</Badge>;
    case 'rejected':
      return <Badge variant="error">Rejected</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

const severityBadge = (severity: string) => {
  const map: Record<string, 'error' | 'warning' | 'default'> = {
    high: 'error',
    medium: 'warning',
    low: 'default',
  };
  return <Badge variant={map[severity] ?? 'default'}>{severity}</Badge>;
};

export function VerifyReportsSection({ reports, onVerify, onReject }: VerifyReportsSectionProps): React.ReactElement {
  const [confirmAction, setConfirmAction] = useState<{ type: 'verify' | 'reject'; id: string; report: ReportToVerify } | null>(null);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'verify') onVerify(confirmAction.id);
    else onReject(confirmAction.id);
    setConfirmAction(null);
  };

  const pending = reports.filter((r) => r.status === 'pending');

  return (
    <motion.section
      id="verify-reports"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      aria-labelledby="verify-reports-heading"
    >
      <SectionHeader title="Verify reports" subtitle={`${pending.length} pending`} as={3} />
      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="px-4 py-3 font-semibold text-stone-700">Report</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Location</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Severity</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 font-semibold text-stone-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {reports.map((report, i) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-900">{report.description}</p>
                      <p className="text-xs text-stone-500">
                        {new Date(report.reportedAt).toLocaleString('en-IN')}
                        {report.reporterName ? ` · ${report.reporterName}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{report.location}</td>
                    <td className="px-4 py-3">{severityBadge(report.severity)}</td>
                    <td className="px-4 py-3">{statusBadge(report.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {report.status === 'pending' && (
                        <span className="flex justify-end gap-2">
                          <SecondaryButton
                            onClick={() => setConfirmAction({ type: 'reject', id: report.id, report })}
                            className="!py-1.5 !px-3 !text-xs"
                          >
                            Reject
                          </SecondaryButton>
                          <PrimaryButton
                            onClick={() => setConfirmAction({ type: 'verify', id: report.id, report })}
                            className="!py-1.5 !px-3 !text-xs"
                          >
                            Verify
                          </PrimaryButton>
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction?.type === 'verify' ? 'Verify report?' : 'Reject report?'}
        message={
          confirmAction
            ? confirmAction.type === 'verify'
              ? `"${confirmAction.report.description}" will be marked as verified.`
              : `"${confirmAction.report.description}" will be rejected.`
            : ''
        }
        confirmLabel={confirmAction?.type === 'verify' ? 'Verify' : 'Reject'}
        variant={confirmAction?.type === 'reject' ? 'danger' : 'primary'}
      />
    </motion.section>
  );
}
