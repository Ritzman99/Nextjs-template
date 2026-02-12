'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Grid.module.scss';

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of columns or CSS grid template (e.g. repeat(3, 1fr)). */
  columns?: number | string;
  /** Gap between cells. Number maps to var(--unit-{n}); string used as-is. */
  gap?: number | string;
  /** Min width per child for auto-fill; when set, columns is ignored and grid uses auto-fill. */
  minChildWidth?: string;
  children?: ReactNode;
}

export function Grid({
  columns = 3,
  gap = 4,
  minChildWidth,
  className = '',
  children,
  ...rest
}: GridProps) {
  const gapClass = typeof gap === 'number' ? styles[`gap${gap}` as keyof typeof styles] : null;
  const gapStyle = typeof gap === 'string' ? { '--grid-gap': gap } as React.CSSProperties : undefined;
  const columnsStyle =
    typeof columns === 'string'
      ? { '--grid-columns': columns }
      : minChildWidth
        ? { '--grid-min-child': minChildWidth }
        : { '--grid-columns': `repeat(${columns}, 1fr)` };

  return (
    <div
      className={[
        styles.grid,
        minChildWidth ? styles.autoFill : '',
        gapClass ?? (typeof gap === 'string' ? '' : ''),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...columnsStyle, ...gapStyle }}
      {...rest}
    >
      {children}
    </div>
  );
}
