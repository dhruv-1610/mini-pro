import { useCallback } from 'react';
import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'default';

export interface ToastItem {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  createdAt: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

interface ToastProviderProps {
  children: ReactNode;
  /** Default duration in ms (default: 4000) */
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  defaultDuration = 4000,
}: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'default', duration = defaultDuration) => {
      const id = crypto.randomUUID();
      const item: ToastItem = {
        id,
        message,
        variant,
        duration,
        createdAt: Date.now(),
      };
      setToasts((prev) => [...prev, item]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [defaultDuration, removeToast]
  );

  const value = useMemo(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-primary-50 text-primary-800 border-primary-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  default: 'bg-white text-stone-800 border-stone-200 shadow-soft',
};

function ToastContainer(): React.ReactElement {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 sm:left-auto sm:right-4 sm:max-w-sm"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={`
              pointer-events-auto flex items-center justify-between gap-3
              rounded-2xl border px-4 py-3
              ${variantClasses[toast.variant ?? 'default']}
            `}
          >
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-lg p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Dismiss notification"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
