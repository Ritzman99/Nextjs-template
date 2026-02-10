'use client';

import type { HTMLAttributes } from 'react';
import styles from './Divider.module.scss';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: React.ReactNode;
}

export function Divider({
  orientation = 'horizontal',
  label,
  className = '',
  ...rest
}: DividerProps) {
  if (label != null && orientation === 'horizontal') {
    return (
      <div className={`${styles.wrapper} ${className}`.trim()} role="separator">
        <hr className={styles.line} aria-hidden />
        <span className={styles.label}>{label}</span>
        <hr className={styles.line} aria-hidden />
      </div>
    );
  }
  return (
    <hr
      className={`${styles.root} ${orientation === 'horizontal' ? styles.horizontal : styles.vertical} ${className}`.trim()}
      role="separator"
      {...rest}
    />
  );
}
