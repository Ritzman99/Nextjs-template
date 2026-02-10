'use client';

import type { HTMLAttributes } from 'react';
import styles from './Chip.module.scss';

export type ChipColor = 'primary' | 'secondary' | 'success' | 'danger';
export type ChipVariant = 'solid' | 'outline';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  label: React.ReactNode;
  onRemove?: () => void;
  color?: ChipColor;
  variant?: ChipVariant;
}

const colorMap: Record<ChipColor, string> = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  success: styles.colorSuccess,
  danger: styles.colorDanger,
};

const variantMap: Record<ChipVariant, string> = {
  solid: styles.solid,
  outline: styles.outline,
};

export function Chip({
  label,
  onRemove,
  color = 'primary',
  variant = 'solid',
  className = '',
  ...rest
}: ChipProps) {
  const classNames = [styles.wrapper, colorMap[color], variantMap[variant]].join(' ');
  return (
    <span className={`${classNames} ${className}`.trim()} {...rest}>
      {label}
      {onRemove != null && (
        <button type="button" className={styles.remove} onClick={onRemove} aria-label="Remove">
          ×
        </button>
      )}
    </span>
  );
}
