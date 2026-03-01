'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { X } from 'lucide-react';
import styles from './Toast.module.scss';

export type ToastType = 'success' | 'error' | 'warning' | 'primary' | 'default';

export interface ToastItem {
  id: string;
  message: React.ReactNode;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  add: (item: Omit<ToastItem, 'id'>) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const duration = item.duration ?? DEFAULT_DURATION;
    const toast: ToastItem = { ...item, id, duration: duration > 0 ? duration : undefined };
    setToasts((prev) => [...prev, toast]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toasts, add, remove }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, remove } = ctx;
  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map((t) => {
        const duration = t.duration ?? DEFAULT_DURATION;
        return (
          <div
            key={t.id}
            className={`${styles.toast} ${t.type !== 'default' ? styles[t.type] : ''} ${duration > 0 ? styles.hasTimer : ''}`}
            role="alert"
          >
            <div className={styles.toastContent}>
              <p className={styles.toastMessage}>{t.message}</p>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
              >
                <X size={18} strokeWidth={2} aria-hidden />
              </button>
            </div>
            {duration > 0 && (
              <div
                className={styles.timerRing}
                style={{ ['--toast-duration' as string]: `${duration}ms` }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className={styles.timerSvg}>
                  <circle className={styles.timerBg} cx="12" cy="12" r="10" />
                  <circle className={styles.timerProgress} cx="12" cy="12" r="10" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return {
    toast: {
      success: (message: React.ReactNode, duration?: number) => ctx.add({ message, type: 'success', duration }),
      error: (message: React.ReactNode, duration?: number) => ctx.add({ message, type: 'error', duration }),
      warning: (message: React.ReactNode, duration?: number) => ctx.add({ message, type: 'warning', duration }),
      primary: (message: React.ReactNode, duration?: number) => ctx.add({ message, type: 'primary', duration }),
      default: (message: React.ReactNode, duration?: number) => ctx.add({ message, type: 'default', duration }),
    },
    remove: ctx.remove,
  };
}
