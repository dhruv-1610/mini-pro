import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { Badge } from '../ui/Badge';
import { ConfirmModal } from '../ui/ConfirmModal';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import type { ExpenseToVerify } from '../../lib/admin';

interface ExpenseVerificationTableProps {
  expenses: ExpenseToVerify[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function formatAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

const statusBadge = (status: ExpenseToVerify['status']) => {
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

export function ExpenseVerificationTable({ expenses, onApprove, onReject }: ExpenseVerificationTableProps): React.ReactElement {
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; id: string; expense: ExpenseToVerify } | null>(null);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'approve') onApprove(confirmAction.id);
    else onReject(confirmAction.id);
    setConfirmAction(null);
  };

  const pending = expenses.filter((e) => e.status === 'pending');

  return (
    <motion.section
      id="expense-verification"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      aria-labelledby="expense-verification-heading"
    >
      <SectionHeader title="Expense verification" subtitle={`${pending.length} pending`} as={3} />
      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="px-4 py-3 font-semibold text-stone-700">Drive</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Category</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Submitted by</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Date</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 font-semibold text-stone-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {expenses.map((exp, i) => (
                  <motion.tr
                    key={exp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-900">{exp.driveTitle}</p>
                      <p className="text-xs text-stone-500">{exp.driveId}</p>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{exp.category}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">{formatAmount(exp.amount)}</td>
                    <td className="px-4 py-3 text-stone-600">{exp.submittedBy}</td>
                    <td className="px-4 py-3 text-stone-500">{new Date(exp.submittedAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">{statusBadge(exp.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {exp.status === 'pending' && (
                        <span className="flex justify-end gap-2">
                          <SecondaryButton
                            onClick={() => setConfirmAction({ type: 'reject', id: exp.id, expense: exp })}
                            className="!py-1.5 !px-3 !text-xs"
                          >
                            Reject
                          </SecondaryButton>
                          <PrimaryButton
                            onClick={() => setConfirmAction({ type: 'approve', id: exp.id, expense: exp })}
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
        title={confirmAction?.type === 'approve' ? 'Approve expense?' : 'Reject expense?'}
        message={
          confirmAction
            ? confirmAction.type === 'approve'
              ? `${confirmAction.expense.category}: ${formatAmount(confirmAction.expense.amount)} for ${confirmAction.expense.driveTitle} will be approved.`
              : `This expense (${formatAmount(confirmAction.expense.amount)}) will be rejected.`
            : ''
        }
        confirmLabel={confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
        variant={confirmAction?.type === 'reject' ? 'danger' : 'primary'}
      />
    </motion.section>
  );
}
