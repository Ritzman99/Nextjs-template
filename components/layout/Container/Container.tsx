'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Container.module.scss';

export type ContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Max width preset. */
  maxWidth?: ContainerMaxWidth;
  /** Horizontal padding. Number maps to var(--unit-{n}); string used as-is. */
  padding?: number | string;
  children?: ReactNode;
}

export function Container({
  maxWidth = 'lg',
  padding,
  className = '',
  children,
  ...rest
}: ContainerProps) {
  const paddingClass = padding !== undefined && typeof padding === 'number'
    ? styles[`padding${padding}` as keyof typeof styles]
    : null;
  const paddingStyle = typeof padding === 'string' ? { '--container-padding': padding } as React.CSSProperties : undefined;

  return (
    <div
      className={[
        styles.container,
        styles[maxWidth],
        paddingClass ?? (typeof padding === 'string' ? '' : ''),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={paddingStyle ?? undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
