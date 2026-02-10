'use client';

import type { HTMLAttributes } from 'react';
import styles from './Progress.module.scss';

export type ProgressSize = 'sm' | 'md' | 'lg';
export type ProgressColor = 'primary' | 'success' | 'danger';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: ProgressSize;
  color?: ProgressColor;
  label?: React.ReactNode;
}

const sizeMap: Record<ProgressSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const colorMap: Record<ProgressColor, string> = {
  primary: styles.colorPrimary,
  success: styles.colorSuccess,
  danger: styles.colorDanger,
};

export function Progress({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  label,
  className = '',
  ...rest
}: ProgressProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`${styles.wrapper} ${sizeMap[size]} ${colorMap[color]} ${className}`.trim()} {...rest}>
      {label != null && <span className={styles.label}>{label}</span>}
      <div className={styles.track} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className={styles.bar} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
