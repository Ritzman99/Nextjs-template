'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { User as UserComponent } from '@/components/ui/User';
import { Button } from '@/components/ui/Button';
import { ThemeSelect } from '@/components/ThemeSelect';
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
  const { data: session, status } = useSession();

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
        <li className={styles.item}>
          <div className={styles.themeSelectWrap}>
            <ThemeSelect />
          </div>
        </li>
        {status === 'loading' ? (
          <li className={styles.item}>
            <span className={styles.link}>...</span>
          </li>
        ) : session?.user ? (
          <>
            <li className={styles.item}>
              <Link href="/profile" className={styles.link}>
                Profile
              </Link>
            </li>
            <li className={styles.item}>
              <div className={styles.userBlock}>
                <UserComponent
                  name={session.user.name ?? session.user.email ?? 'User'}
                  description={session.user.email}
                  avatar={session.user.avatar ?? session.user.image ?? null}
                  size="sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  aria-label="Sign out"
                >
                  Sign out
                </Button>
              </div>
            </li>
          </>
        ) : (
          <li className={styles.item}>
            <Link href="/auth/signin" className={styles.link}>
              Sign in
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
