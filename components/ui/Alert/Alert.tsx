'use client';

import type { HTMLAttributes } from 'react';
import { X } from 'lucide-react';
import styles from './Alert.module.scss';

export type AlertColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type AlertVariant = 'solid' | 'outline' | 'soft';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  color?: AlertColor;
  variant?: AlertVariant;
  icon?: React.ReactNode;
  /** Optional secondary text or content shown below the main content. */
  subContent?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const colorMap: Record<AlertColor, string> = {
  default: styles.colorDefault,
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
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
  subContent,
  dismissible = false,
  onDismiss,
  className = '',
  children,
  ...rest
}: AlertProps) {
  const classNames = [styles.wrapper, colorMap[color], variantMap[variant]].join(' ');
  return (
    <div className={`${classNames} ${className}`.trim()} role="alert" {...rest}>
      {icon != null && <span aria-hidden>{icon}</span>}
      <div className={styles.content}>
        {children}
        {subContent != null && <div className={styles.subContent}>{subContent}</div>}
      </div>
      {dismissible && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <X className={styles.dismissIcon} aria-hidden size={18} />
        </button>
      )}
    </div>
  );
}
