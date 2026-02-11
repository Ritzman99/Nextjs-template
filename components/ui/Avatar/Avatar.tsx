'use client';

import type { HTMLAttributes } from 'react';
import styles from './Avatar.module.scss';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type AvatarColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  size?: AvatarSize;
  radius?: AvatarRadius;
  color?: AvatarColor;
}

const sizeMap: Record<AvatarSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const radiusMap: Record<AvatarRadius, string> = {
  none: styles.radiusNone,
  sm: styles.radiusSm,
  md: styles.radiusMd,
  lg: styles.radiusLg,
  full: styles.radiusFull,
};

const colorMap: Record<AvatarColor, string> = {
  default: styles.colorDefault,
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  success: styles.colorSuccess,
  warning: styles.colorWarning,
  danger: styles.colorDanger,
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  radius = 'full',
  color = 'default',
  className = '',
  ...rest
}: AvatarProps) {
  const resolvedFallback =
    fallback != null
      ? (typeof fallback === 'string' ? getInitials(fallback) : fallback)
      : (alt ? getInitials(alt) : '?');

  return (
    <span
      className={`${styles.wrapper} ${sizeMap[size]} ${radiusMap[radius]} ${colorMap[color]} ${className}`.trim()}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Avatar supports external URLs and optional sizing; next/image requires known dimensions
        <img src={src} alt={alt} className={styles.img} />
      ) : (
        <span className={styles.fallback}>{resolvedFallback}</span>
      )}
    </span>
  );
}
