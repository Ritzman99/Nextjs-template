'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui';
import {
  PenSquare,
  Inbox,
  Star,
  Send,
  FileText,
  Trash2,
  Tag,
} from 'lucide-react';
import styles from './InboxSidebar.module.scss';

const FOLDERS = [
  { href: '/inbox', folder: 'inbox', label: 'Inbox', icon: Inbox },
  { href: '/inbox?folder=starred', folder: 'starred', label: 'Starred', icon: Star },
  { href: '/inbox?folder=sent', folder: 'sent', label: 'Sent', icon: Send },
  { href: '/inbox?folder=draft', folder: 'draft', label: 'Draft', icon: FileText },
  { href: '/inbox?folder=trash', folder: 'trash', label: 'Trash', icon: Trash2 },
] as const;

const LABELS = [
  { label: 'Primary', value: 'Primary' },
  { label: 'Social', value: 'Social' },
  { label: 'Work', value: 'Work' },
  { label: 'Friends', value: 'Friends' },
];

export interface InboxSidebarProps {
  onCompose: () => void;
}

export function InboxSidebar({ onCompose }: InboxSidebarProps) {
  const pathname = usePathname();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const currentFolder = searchParams?.get('folder') ?? 'inbox';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.composeBtn}>
        <Button
          color="primary"
          onClick={onCompose}
          className={styles.composeButton}
        >
          <PenSquare className={styles.composeIcon} aria-hidden />
          Compose
        </Button>
      </div>
      <div className={styles.sidebarSection}>
        <span className={styles.sidebarSectionLabel}>My Email</span>
        <ul className={styles.sidebarList}>
          {FOLDERS.map(({ href, folder, label, icon: Icon }) => {
            const isActive = currentFolder === folder;
            return (
              <li key={folder}>
                <Link
                  href={href}
                  className={isActive ? styles.sidebarLinkActive : styles.sidebarLink}
                >
                  <Icon className={styles.folderIcon} aria-hidden size={18} />
                  {label}
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
              >
                <Tag className={styles.folderIcon} aria-hidden size={18} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
