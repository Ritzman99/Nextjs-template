'use client';

import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import styles from './Button.module.scss';

export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  size?: ButtonSize;
  radius?: ButtonRadius;
  variant?: ButtonVariant;
}

const colorMap: Record<ButtonColor, string> = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  success: styles.colorSuccess,
  warning: styles.colorWarning,
  danger: styles.colorDanger,
};

const sizeMap: Record<ButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const radiusMap: Record<ButtonRadius, string> = {
  none: styles.radiusNone,
  sm: styles.radiusSm,
  md: styles.radiusMd,
  lg: styles.radiusLg,
  full: styles.radiusFull,
};

const variantMap: Record<ButtonVariant, string> = {
  solid: '',
  outline: styles.outline,
  ghost: styles.ghost,
  link: styles.link,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    color = 'primary',
    size = 'md',
    radius = 'md',
    variant = 'solid',
    className = '',
    children,
    disabled,
    ...rest
  },
  ref
) {
  const classNames = [
    styles.root,
    colorMap[color],
    sizeMap[size],
    radiusMap[radius],
    variantMap[variant],
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      ref={ref}
      type="button"
      className={`${classNames} ${className}`.trim()}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
});
