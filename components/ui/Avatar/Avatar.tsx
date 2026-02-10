'use client';

import type { HTMLAttributes } from 'react';
import styles from './Avatar.module.scss';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
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
  className = '',
  ...rest
}: AvatarProps) {
  const resolvedFallback =
    fallback != null
      ? (typeof fallback === 'string' ? getInitials(fallback) : fallback)
      : (alt ? getInitials(alt) : '?');

  return (
    <span className={`${styles.root} ${sizeMap[size]} ${className}`.trim()} {...rest}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Avatar supports external URLs and optional sizing; next/image requires known dimensions
        <img src={src} alt={alt} className={styles.img} />
      ) : (
        <span className={styles.fallback}>{resolvedFallback}</span>
      )}
    </span>
  );
}
