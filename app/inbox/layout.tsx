'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { InboxSidebar, InboxSidebarProvider, useInboxSidebar } from '@/components/inbox';
import styles from './inbox.module.scss';

function InboxLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useInboxSidebar();

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  return (
    <div className={styles.inboxLayout}>
      <div
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayVisible : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <InboxSidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/inbox');
      return;
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className={styles.main}>
        <p className={styles.emptyState}>Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <InboxSidebarProvider>
      <InboxLayoutContent>{children}</InboxLayoutContent>
    </InboxSidebarProvider>
  );
}
