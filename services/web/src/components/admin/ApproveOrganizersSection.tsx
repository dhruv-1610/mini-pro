import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { Badge } from '../ui/Badge';
import { ConfirmModal } from '../ui/ConfirmModal';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import type { OrganizerToApprove } from '../../lib/admin';

interface ApproveOrganizersSectionProps {
  organizers: OrganizerToApprove[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const statusBadge = (status: OrganizerToApprove['status']) => {
  switch (status) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'approved':
      return <Badge variant="success">Approved</Badge>;
    case 'rejected':
      return <Badge variant="error">Rejected</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export function ApproveOrganizersSection({ organizers, onApprove, onReject }: ApproveOrganizersSectionProps): React.ReactElement {
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; id: string; organizer: OrganizerToApprove } | null>(null);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'approve') onApprove(confirmAction.id);
    else onReject(confirmAction.id);
    setConfirmAction(null);
  };

  const pending = organizers.filter((o) => o.status === 'pending');

  return (
    <motion.section
      id="approve-organizers"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
      aria-labelledby="approve-organizers-heading"
    >
      <SectionHeader title="Approve organizers" subtitle={`${pending.length} pending`} as={3} />
      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Email</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Organization</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Applied</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 font-semibold text-stone-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {organizers.map((org, i) => (
                  <motion.tr
                    key={org.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-stone-900">{org.name}</td>
                    <td className="px-4 py-3 text-stone-600">{org.email}</td>
                    <td className="px-4 py-3 text-stone-600">{org.organization ?? '—'}</td>
                    <td className="px-4 py-3 text-stone-500">{new Date(org.appliedAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">{statusBadge(org.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {org.status === 'pending' && (
                        <span className="flex justify-end gap-2">
                          <SecondaryButton
                            onClick={() => setConfirmAction({ type: 'reject', id: org.id, organizer: org })}
                            className="!py-1.5 !px-3 !text-xs"
                          >
                            Reject
                          </SecondaryButton>
                          <PrimaryButton
                            onClick={() => setConfirmAction({ type: 'approve', id: org.id, organizer: org })}
                            className="!py-1.5 !px-3 !text-xs"
                          >
                            Approve
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
        title={confirmAction?.type === 'approve' ? 'Approve organizer?' : 'Reject organizer?'}
        message={
          confirmAction
            ? confirmAction.type === 'approve'
              ? `${confirmAction.organizer.name} will be approved as an organizer.`
              : `${confirmAction.organizer.name}'s application will be rejected.`
            : ''
        }
        confirmLabel={confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
        variant={confirmAction?.type === 'reject' ? 'danger' : 'primary'}
      />
    </motion.section>
  );
}
