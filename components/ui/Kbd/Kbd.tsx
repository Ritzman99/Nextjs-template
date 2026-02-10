'use client';

import type { HTMLAttributes } from 'react';
import styles from './Kbd.module.scss';

export type KbdProps = HTMLAttributes<HTMLElement>;

export function Kbd({ className = '', children, ...rest }: KbdProps) {
  return (
    <kbd className={`${styles.root} ${className}`.trim()} {...rest}>
      {children}
    </kbd>
  );
}
