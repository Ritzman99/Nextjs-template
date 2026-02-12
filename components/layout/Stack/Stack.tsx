'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Stack.module.scss';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Flex direction. */
  direction?: 'row' | 'column';
  /** Gap between items. Number maps to var(--unit-{n}); string used as-is (e.g. var(--unit-4)). */
  gap?: number | string;
  /** Align items (align-items). */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Justify content. */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Allow wrapping. */
  wrap?: boolean;
  children?: ReactNode;
}

export function Stack({
  direction = 'column',
  gap,
  align,
  justify,
  wrap = false,
  className = '',
  children,
  ...rest
}: StackProps) {
  const gapClass = gap !== undefined
    ? (typeof gap === 'number' ? styles[`gap${gap}` as keyof typeof styles] : null)
    : null;
  const gapStyle = typeof gap === 'string' ? { '--stack-gap': gap } as React.CSSProperties : undefined;

  return (
    <div
      className={[
        styles.stack,
        direction === 'row' ? styles.row : styles.column,
        gapClass ?? (typeof gap === 'string' ? '' : ''),
        align ? styles[`align${align.charAt(0).toUpperCase() + align.slice(1)}` as keyof typeof styles] : '',
        justify ? styles[`justify${justify.charAt(0).toUpperCase() + justify.slice(1)}` as keyof typeof styles] : '',
        wrap ? styles.wrap : '',
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
