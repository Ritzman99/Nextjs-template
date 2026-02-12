'use client';

import { Children, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Split.module.scss';

export interface SplitProps extends HTMLAttributes<HTMLDivElement> {
  /** Which side the sidebar is on. */
  side?: 'left' | 'right';
  /** Width of the sidebar (e.g. var(--sidebar-width)). */
  sideWidth?: string;
  /** Sidebar content (when using named slots). */
  sidebar?: ReactNode;
  /** Main content (when using named slots). */
  main?: ReactNode;
  /** Alternatively pass two children: first = sidebar, second = main. */
  children?: ReactNode;
}

export function Split({
  side = 'left',
  sideWidth,
  sidebar,
  main,
  children,
  className = '',
  ...rest
}: SplitProps) {
  const childArray = Children.toArray(children);
  const sidebarNode = sidebar ?? (childArray.length >= 1 ? childArray[0] : null);
  const mainNode = main ?? (childArray.length >= 2 ? childArray[1] : childArray[0] ?? null);

  const style = sideWidth ? { '--split-side-width': sideWidth } as React.CSSProperties : undefined;

  return (
    <div
      className={[styles.split, side === 'right' ? styles.sideRight : '', className].filter(Boolean).join(' ')}
      style={style}
      {...rest}
    >
      {sidebarNode != null && <div className={styles.side}>{sidebarNode}</div>}
      {mainNode != null && <div className={styles.main}>{mainNode}</div>}
    </div>
  );
}
