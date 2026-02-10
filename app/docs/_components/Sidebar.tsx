'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { COMPONENT_DOCS } from '../registry';
import styles from '../docs.module.scss';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.sidebarNav} aria-label="Component docs">
        <Link
          href="/docs"
          className={pathname === '/docs' ? styles.sidebarLinkActive : styles.sidebarLink}
        >
          Overview
        </Link>
        <span className={styles.sidebarGroupLabel}>Components</span>
        <ul className={styles.sidebarList}>
          {COMPONENT_DOCS.map((doc) => {
            const href = `/docs/components/${doc.slug}`;
            const isActive = pathname === href;
            return (
              <li key={doc.slug}>
                <Link
                  href={href}
                  className={isActive ? styles.sidebarLinkActive : styles.sidebarLink}
                >
                  {doc.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
