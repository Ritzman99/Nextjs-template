'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.scss';

export interface SidebarLink {
  href: string;
  label: string;
}

export interface SidebarProps {
  /** Optional overview/first link (e.g. "Overview" pointing to /docs) */
  overviewLink?: SidebarLink;
  /** Label for the link group (e.g. "Components") */
  groupLabel?: string;
  /** Navigation links in the sidebar */
  links: SidebarLink[];
  /** Accessible label for the nav element */
  ariaLabel?: string;
}

export function Sidebar({
  overviewLink,
  groupLabel = 'Components',
  links,
  ariaLabel = 'Sidebar navigation',
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.sidebarNav} aria-label={ariaLabel}>
        {overviewLink && (
          <Link
            href={overviewLink.href}
            className={pathname === overviewLink.href ? styles.sidebarLinkActive : styles.sidebarLink}
          >
            {overviewLink.label}
          </Link>
        )}
        <span className={styles.sidebarGroupLabel}>{groupLabel}</span>
        <ul className={styles.sidebarList}>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={isActive ? styles.sidebarLinkActive : styles.sidebarLink}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
