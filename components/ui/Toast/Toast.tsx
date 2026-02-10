'use client';

import { createContext, useCallback, useContext, useState } from 'react';
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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast: ToastItem = { ...item, id };
    setToasts((prev) => [...prev, toast]);
    const duration = item.duration ?? 5000;
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
  const { toasts } = ctx;
  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${t.type !== 'default' ? styles[t.type] : ''}`}
          role="alert"
        >
          {t.message}
        </div>
      ))}
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
