'use client';

import type { HTMLAttributes } from 'react';
import { Avatar } from '../Avatar';
import styles from './AvatarGroup.module.scss';

export interface AvatarGroupItem {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  items?: AvatarGroupItem[];
  children?: React.ReactNode;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({
  items: itemsProp,
  children,
  max,
  size = 'md',
  className = '',
  ...rest
}: AvatarGroupProps) {
  const items = itemsProp ?? (children != null ? (Array.isArray(children) ? children : [children]) : []);
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  const show = max != null ? Math.min(total, max) : total;
  const overflowCount = max != null && total > max ? total - max : 0;

  return (
    <div className={`${styles.wrapper} ${className}`.trim()} {...rest}>
      {list.slice(0, show).map((item, i) => (
        <span key={i} className={styles.avatar}>
          {typeof item === 'object' && item !== null && 'src' in item ? (
            <Avatar size={size} src={(item as AvatarGroupItem).src} alt={(item as AvatarGroupItem).alt} fallback={(item as AvatarGroupItem).fallback} />
          ) : (
            <Avatar size={size} fallback={String(item)} />
          )}
        </span>
      ))}
      {overflowCount > 0 && (
        <span className={styles.overflow}>+{overflowCount}</span>
      )}
    </div>
  );
}
