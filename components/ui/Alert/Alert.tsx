'use client';

import type { HTMLAttributes } from 'react';
import styles from './Alert.module.scss';

export type AlertColor = 'primary' | 'success' | 'warning' | 'danger';
export type AlertVariant = 'solid' | 'outline' | 'soft';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  color?: AlertColor;
  variant?: AlertVariant;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const colorMap: Record<AlertColor, string> = {
  primary: styles.colorPrimary,
  success: styles.colorSuccess,
  warning: styles.colorWarning,
  danger: styles.colorDanger,
};

const variantMap: Record<AlertVariant, string> = {
  solid: styles.solid,
  outline: styles.outline,
  soft: styles.soft,
};

export function Alert({
  color = 'primary',
  variant = 'soft',
  icon,
  dismissible = false,
  onDismiss,
  className = '',
  children,
  ...rest
}: AlertProps) {
  const classNames = [styles.root, colorMap[color], variantMap[variant]].join(' ');
  return (
    <div className={`${classNames} ${className}`.trim()} role="alert" {...rest}>
      {icon != null && <span aria-hidden>{icon}</span>}
      <div className={styles.content}>{children}</div>
      {dismissible && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
