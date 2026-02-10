'use client';

import type { HTMLAttributes } from 'react';
import styles from './Code.module.scss';

export interface CodeProps extends HTMLAttributes<HTMLElement> {
  block?: boolean;
}

export function Code({
  block = false,
  className = '',
  children,
  ...rest
}: CodeProps) {
  const Component = block ? 'pre' : 'code';
  const styleClass = block ? styles.block : styles.inline;
  return (
    <Component className={`${styleClass} ${className}`.trim()} {...rest}>
      {children}
    </Component>
  );
}
