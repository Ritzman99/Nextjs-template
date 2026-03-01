'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ComposeForm } from '@/components/inbox';
import styles from '../inbox.module.scss';

export default function InboxComposePage() {
  const router = useRouter();

  function handleSent(data: { id: string }) {
    router.push(`/inbox/conversations/${data.id}?folder=sent`);
  }

  function handleDraftSaved(data: { id: string }) {
    router.push(`/inbox/conversations/${data.id}?folder=draft`);
  }

  function handleCancel() {
    router.push('/inbox');
  }

  return (
    <div className={styles.detailPanel}>
      <header className={styles.detailHeader}>
        <Link
          href="/inbox"
          className={styles.detailBack}
          aria-label="Back to Inbox"
        >
          <ArrowLeft size={20} aria-hidden />
        </Link>
        <h1 className={styles.detailSubject}>New message</h1>
      </header>
      <ComposeForm
        onSent={handleSent}
        onCancel={handleCancel}
        onDraftSaved={handleDraftSaved}
      />
    </div>
  );
}
