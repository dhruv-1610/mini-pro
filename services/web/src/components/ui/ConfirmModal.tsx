import { Modal } from './Modal';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'default';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps): React.ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" closeOnOverlayClick={!isLoading}>
      <div className="space-y-4">
        <h2 id="modal-title" className="text-lg font-semibold text-stone-900">
          {title}
        </h2>
        <p className="text-sm text-stone-600">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButton onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              onConfirm();
            }}
            isLoading={isLoading}
            className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : variant === 'primary' ? '' : 'bg-stone-700 hover:bg-stone-800 focus:ring-stone-500'}
          >
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
