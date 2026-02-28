'use client';

import { Menu } from 'lucide-react';
import { useInboxSidebar } from './InboxSidebarContext';
import styles from './InboxSidebarToggle.module.scss';

export function InboxSidebarToggle() {
  const { sidebarOpen, toggleSidebar } = useInboxSidebar();

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleSidebar}
      aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
    >
      <Menu size={20} aria-hidden />
    </button>
  );
}
