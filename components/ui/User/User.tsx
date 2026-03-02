'use client';

import type { HTMLAttributes } from 'react';
import { Avatar } from '../Avatar';
import styles from './User.module.scss';

export interface UserProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  description?: React.ReactNode;
  avatar?: string | null | React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Optional class for the avatar wrapper (e.g. nav profile ring) */
  avatarClassName?: string;
}

export function User({
  name,
  description,
  avatar,
  size = 'md',
  className = '',
  avatarClassName,
  ...rest
}: UserProps) {
  return (
    <div className={`${styles.wrapper} ${className}`.trim()} {...rest}>
      <span className={`${styles.avatar} ${avatarClassName ?? ''}`.trim()}>
        {typeof avatar === 'string' || avatar == null ? (
          <Avatar src={typeof avatar === 'string' ? avatar : undefined} fallback={name} size={size} />
        ) : (
          avatar
        )}
      </span>
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        {description != null && <span className={styles.description}>{description}</span>}
      </div>
    </div>
  );
}
