'use client';

import { useState, useRef, useEffect } from 'react';
import { Tag } from 'lucide-react';
import { Button } from '@/components/ui';
import { INBOX_LABELS } from './constants';
import styles from './LabelPicker.module.scss';

export interface LabelPickerProps {
  conversationId: string;
  labels: string[];
  onLabelsChange: (labels: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function LabelPicker({
  conversationId,
  labels,
  onLabelsChange,
  disabled,
  className = '',
}: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function toggleLabel(value: string) {
    const next = labels.includes(value) ? labels.filter((l) => l !== value) : [...labels, value];
    setUpdating(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: next }),
      });
      if (res.ok) onLabelsChange(next);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className={`${styles.wrapper} ${className}`} ref={popoverRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-label="Labels"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Tag size={20} aria-hidden />
      </Button>
      {open && (
        <div className={styles.popover} role="menu">
          <span className={styles.popoverTitle}>Labels</span>
          <ul className={styles.popoverList}>
            {INBOX_LABELS.map(({ label, value }) => (
              <li key={value}>
                <button
                  type="button"
                  className={styles.popoverItem}
                  onClick={() => toggleLabel(value)}
                  disabled={updating}
                  role="menuitemcheckbox"
                  aria-checked={labels.includes(value)}
                >
                  <span className={styles.checkbox}>{labels.includes(value) ? '✓' : ''}</span>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
