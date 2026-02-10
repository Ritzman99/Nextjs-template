'use client';

import type { HTMLAttributes } from 'react';
import styles from './Spinner.module.scss';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = 'primary' | 'secondary' | 'success' | 'danger';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  color?: SpinnerColor;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const colorMap: Record<SpinnerColor, string> = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  success: styles.colorSuccess,
  danger: styles.colorDanger,
};

export function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
  ...rest
}: SpinnerProps) {
  const classNames = [styles.wrapper, sizeMap[size], colorMap[color]].join(' ');
  return <span className={`${classNames} ${className}`.trim()} role="status" aria-label="Loading" {...rest} />;
}
