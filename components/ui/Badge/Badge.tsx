'use client';

import type { HTMLAttributes } from 'react';
import styles from './Badge.module.scss';

export type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'solid' | 'outline' | 'soft';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  size?: BadgeSize;
  variant?: BadgeVariant;
  dot?: boolean;
}

const colorMap: Record<BadgeColor, string> = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  success: styles.colorSuccess,
  info: styles.colorInfo,
  warning: styles.colorWarning,
  danger: styles.colorDanger,
};

const sizeMap: Record<BadgeSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const variantMap: Record<BadgeVariant, string> = {
  solid: styles.solid,
  outline: styles.outline,
  soft: styles.soft,
};

export function Badge({
  color = 'primary',
  size = 'md',
  variant = 'solid',
  dot = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const classNames = [
    styles.root,
    colorMap[color],
    sizeMap[size],
    variantMap[variant],
  ].join(' ');
  return (
    <span className={`${classNames} ${className}`.trim()} {...rest}>
      {dot && <span className={styles.dot} aria-hidden />}
      {children}
    </span>
  );
}
