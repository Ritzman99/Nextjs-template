'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import {
  PenSquare,
  Inbox,
  Star,
  Send,
  FileText,
  Trash2,
  Tag,
  UserPlus,
  Users,
  CalendarCheck,
} from 'lucide-react';
import { useInboxSidebar } from './InboxSidebarContext';
import styles from './InboxSidebar.module.scss';

const FOLDERS = [
  { href: '/inbox', folder: 'inbox', label: 'Inbox', icon: Inbox, showUnread: true, showFriendRequestsCount: false },
  { href: '/inbox?folder=event_invites', folder: 'event_invites', label: 'Event invites', icon: CalendarCheck, showUnread: false, showFriendRequestsCount: false },
  { href: '/inbox?folder=friend_requests', folder: 'friend_requests', label: 'Friend requests', icon: UserPlus, showUnread: false, showFriendRequestsCount: true },
  { href: '/inbox?folder=starred', folder: 'starred', label: 'Starred', icon: Star, showUnread: false, showFriendRequestsCount: false },
  { href: '/inbox?folder=sent', folder: 'sent', label: 'Sent', icon: Send, showUnread: false, showFriendRequestsCount: false },
  { href: '/inbox?folder=draft', folder: 'draft', label: 'Draft', icon: FileText, showUnread: false, showFriendRequestsCount: false },
  { href: '/inbox?folder=trash', folder: 'trash', label: 'Trash', icon: Trash2, showUnread: false, showFriendRequestsCount: false },
] as const;

import { INBOX_LABELS } from './constants';

const LABELS = INBOX_LABELS;

export interface InboxSidebarProps {
  /** Optional; reserved for future use. Compose links to /inbox/compose. */
  onCompose?: () => void;
}

function closeSidebarOnMobile(setSidebarOpen: (open: boolean) => void) {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    setSidebarOpen(false);
  }
}

export function InboxSidebar(_props?: InboxSidebarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useInboxSidebar();
  const currentFolder = searchParams?.get('folder') ?? 'inbox';
  const [unreadCount, setUnreadCount] = useState(0);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchUnread() {
      try {
        const res = await fetch('/api/inbox/unread-count');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          setUnreadCount(typeof data.count === 'number' ? data.count : 0);
          setFriendRequestsCount(typeof data.friendRequestsCount === 'number' ? data.friendRequestsCount : 0);
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
          setFriendRequestsCount(0);
        }
      }
    }
    fetchUnread();
    return () => { cancelled = true; };
  }, [pathname]);

  return (
    <aside
      className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
      data-open={sidebarOpen}
    >
      <div className={styles.composeBtn}>
        <Link
          href="/inbox/compose"
          className={styles.composeLink}
          onClick={() => closeSidebarOnMobile(setSidebarOpen)}
        >
          <PenSquare className={styles.composeIcon} aria-hidden />
          Compose
        </Link>
      </div>
      <div className={styles.sidebarSection}>
        <span className={styles.sidebarSectionLabel}>My Email</span>
        <ul className={styles.sidebarList}>
          {FOLDERS.map(({ href, folder, label, icon: Icon, showUnread, showFriendRequestsCount }) => {
            const isActive = currentFolder === folder;
            const count = showUnread ? unreadCount : showFriendRequestsCount ? friendRequestsCount : 0;
            return (
              <li key={folder}>
                <Link
                  href={href}
                  className={isActive ? styles.sidebarLinkActive : styles.sidebarLink}
                  onClick={() => closeSidebarOnMobile(setSidebarOpen)}
                >
                  <Icon className={styles.folderIcon} aria-hidden size={18} />
                  <span className={styles.folderLabel}>{label}</span>
                  {count > 0 && (
                    <span className={styles.unreadBadge} aria-label={showFriendRequestsCount ? `${count} pending` : `${count} unread`}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className={styles.sidebarSection}>
        <span className={styles.sidebarSectionLabel}>Label</span>
        <ul className={styles.sidebarList}>
          {LABELS.map(({ label, value }) => (
            <li key={value}>
              <Link
                href={`/inbox?label=${encodeURIComponent(value)}`}
                className={styles.sidebarLink}
                onClick={() => closeSidebarOnMobile(setSidebarOpen)}
              >
                <Tag className={styles.folderIcon} aria-hidden size={18} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.sidebarSection}>
        <span className={styles.sidebarSectionLabel}>App</span>
        <ul className={styles.sidebarList}>
          <li>
            <Link
              href="/contacts"
              className={styles.sidebarLink}
              onClick={() => closeSidebarOnMobile(setSidebarOpen)}
            >
              <Users className={styles.folderIcon} aria-hidden size={18} />
              Contacts
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
