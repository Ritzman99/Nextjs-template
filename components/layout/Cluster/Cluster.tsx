'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Cluster.module.scss';

export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  /** Gap between items. Number maps to var(--unit-{n}); string used as-is. */
  gap?: number | string;
  /** Justify content. */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  children?: ReactNode;
}

export function Cluster({
  gap = 2,
  justify,
  className = '',
  children,
  ...rest
}: ClusterProps) {
  const gapClass = typeof gap === 'number' ? styles[`gap${gap}` as keyof typeof styles] : null;
  const gapStyle = typeof gap === 'string' ? { '--cluster-gap': gap } as React.CSSProperties : undefined;

  return (
    <div
      className={[
        styles.cluster,
        gapClass ?? (typeof gap === 'string' ? '' : ''),
        justify ? styles[`justify${justify.charAt(0).toUpperCase() + justify.slice(1)}` as keyof typeof styles] : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={gapStyle}
      {...rest}
    >
      {children}
    </div>
  );
}
