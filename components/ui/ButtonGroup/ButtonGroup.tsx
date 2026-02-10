'use client';

import type { HTMLAttributes } from 'react';
import styles from './ButtonGroup.module.scss';

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  attached?: boolean;
}

export function ButtonGroup({
  orientation = 'horizontal',
  attached = false,
  className = '',
  children,
  ...rest
}: ButtonGroupProps) {
  const classNames = [
    styles.wrapper,
    orientation === 'horizontal' ? styles.horizontal : styles.vertical,
    attached ? styles.attached : styles.gap,
  ].join(' ');
  return (
    <div className={`${classNames} ${className}`.trim()} role="group" {...rest}>
      {children}
    </div>
  );
}
