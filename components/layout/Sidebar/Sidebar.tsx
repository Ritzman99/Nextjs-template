'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.scss';

export interface SidebarLink {
  href: string;
  label: string;
}

export interface SidebarGroup {
  label: string;
  links: SidebarLink[];
}

export interface SidebarProps {
  /** Optional overview/first link (e.g. "Overview" pointing to /docs) */
  overviewLink?: SidebarLink;
  /** When set, render multiple groups (e.g. Layout + Components). Takes precedence over groupLabel/links. */
  groups?: SidebarGroup[];
  /** Label for the single link group (e.g. "Components"). Ignored when groups is set. */
  groupLabel?: string;
  /** Navigation links in the sidebar. Ignored when groups is set. */
  links?: SidebarLink[];
  /** Accessible label for the nav element */
  ariaLabel?: string;
}

export function Sidebar({
  overviewLink,
  groups,
  groupLabel = 'Components',
  links = [],
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
        {groups != null && groups.length > 0
          ? groups.map((group) => (
              <div key={group.label} className={styles.sidebarGroup}>
                <span className={styles.sidebarGroupLabel}>{group.label}</span>
                <ul className={styles.sidebarList}>
                  {group.links.map((link) => {
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
              </div>
            ))
          : (
            <>
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
            </>
          )}
      </nav>
    </aside>
  );
}
