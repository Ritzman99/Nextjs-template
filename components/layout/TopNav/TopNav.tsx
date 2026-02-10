'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from './TopNav.module.scss';

export interface TopNavItem {
  href: string;
  label: string;
}

export interface TopNavProps {
  /** Brand text or node (e.g. app name); links to / when clicked */
  brand?: ReactNode;
  /** Navigation links shown in the nav bar */
  items: TopNavItem[];
}

export function TopNav({ brand = 'App', items }: TopNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.wrapper} aria-label="Main navigation">
      <Link href="/" className={styles.brand}>
        {brand}
      </Link>
      <ul className={styles.list}>
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <li key={item.href} className={styles.item}>
              <Link
                href={item.href}
                className={isActive ? `${styles.link} ${styles.linkActive}` : styles.link}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
