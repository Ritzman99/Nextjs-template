'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import { User as UserComponent } from '@/components/ui/User';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ADMIN_ROLE } from '@/lib/adminConstants';
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === ADMIN_ROLE;
  const navItems = isAdmin ? [...items, { href: '/admin', label: 'Admin' }] : items;

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  useEffect(() => {
    if (!session?.user?.id) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    fetch('/api/inbox/unread-count')
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => {
        if (!cancelled && typeof data?.count === 'number') setUnreadCount(data.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  return (
    <nav className={styles.wrapper} aria-label="Main navigation">
      <Link href="/" className={styles.brand}>
        {brand}
      </Link>
      <button
        type="button"
        className={styles.menuButton}
        onClick={() => setMobileMenuOpen((o) => !o)}
        aria-expanded={mobileMenuOpen}
        aria-controls="topnav-menu"
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
      </button>
      <div
        id="topnav-menu"
        className={mobileMenuOpen ? `${styles.menuOverlay} ${styles.menuOverlayOpen}` : styles.menuOverlay}
        aria-hidden={!mobileMenuOpen}
        onClick={closeMobileMenu}
      >
        <ul className={styles.list} onClick={(e) => e.stopPropagation()}>
        {navItems.map((item) => {
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
          <div className={styles.themeToggleWrap}>
            <ThemeToggle />
          </div>
        </li>
        {status === 'loading' ? (
          <li className={styles.item}>
            <span className={styles.link}>...</span>
          </li>
        ) : session?.user ? (
          <>
            <li className={styles.item}>
              <Link
                href="/inbox"
                className={pathname?.startsWith('/inbox') ? `${styles.link} ${styles.linkActive}` : styles.link}
                aria-label={unreadCount > 0 ? `${unreadCount} unread messages` : 'Inbox'}
                aria-current={pathname?.startsWith('/inbox') ? 'page' : undefined}
              >
                <span className={styles.bellWrap}>
                  <Bell size={20} aria-hidden />
                  {unreadCount > 0 && (
                    <span className={styles.bellBadge} aria-hidden>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </Link>
            </li>
            <li className={styles.item}>
              <div className={styles.userBlock}>
                <Link
                  href="/profile"
                  className={styles.profileLink}
                  aria-label="Profile settings"
                  aria-current={pathname === '/profile' ? 'page' : undefined}
                >
                  <UserComponent
                    name={session.user.name ?? session.user.email ?? 'User'}
                    avatar={session.user.avatar ?? session.user.image ?? null}
                    size="sm"
                    className={styles.profileUser}
                    avatarClassName={styles.avatarRing}
                  />
                </Link>
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
      </div>
    </nav>
  );
}
