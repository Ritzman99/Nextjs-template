'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { InboxSidebar, ComposeModal } from '@/components/inbox';
import styles from './inbox.module.scss';

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [composeOpen, setComposeOpen] = useState(false);

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
    <div className={styles.inboxLayout}>
      <InboxSidebar onCompose={() => setComposeOpen(true)} />
      <main className={styles.main}>{children}</main>
      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => window.location.reload()}
      />
    </div>
  );
}
