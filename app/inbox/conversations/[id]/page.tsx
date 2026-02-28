'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui';
import { MessageThread } from '@/components/inbox';
import type { MessageItem } from '@/components/inbox';
import styles from '../../inbox.module.scss';

export default function InboxConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params?.id as string | undefined;

  const [conversation, setConversation] = useState<{
    id: string;
    type: string;
    subject: string | null;
    updatedAt: string;
  } | null>(null);
  const [state, setState] = useState<{
    folder: string;
    labels: string[];
    readAt: string | null;
    starred: boolean;
  } | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingStar, setTogglingStar] = useState(false);

  const fetchConversation = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${id}`);
      if (res.status === 404) {
        setConversation(null);
        setState(null);
        setMessages([]);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setConversation(data.conversation);
      setState(data.state);
      setMessages(data.messages ?? []);
    } catch {
      setConversation(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  useEffect(() => {
    if (!id || !session?.user?.id) return;
    fetch(`/api/inbox/conversations/${id}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readAt: new Date().toISOString() }),
    }).catch(() => {});
  }, [id, session?.user?.id]);

  async function toggleStar() {
    if (!id || togglingStar || state === null) return;
    setTogglingStar(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !state.starred }),
      });
      if (res.ok) setState((s) => (s ? { ...s, starred: !s.starred } : s));
    } catch {
      // ignore
    }
    setTogglingStar(false);
  }

  if (!id) {
    router.replace('/inbox');
    return null;
  }

  if (loading) {
    return (
      <div className={styles.detailPanel}>
        <div className={styles.emptyState}>Loading…</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className={styles.detailPanel}>
        <div className={styles.emptyState}>Conversation not found.</div>
        <Link href="/inbox">Back to Inbox</Link>
      </div>
    );
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
        <h1 className={styles.detailSubject}>
          {conversation.subject || '(No subject)'}
        </h1>
        {state && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleStar}
            disabled={togglingStar}
            aria-label={state.starred ? 'Unstar' : 'Star'}
          >
            <Star
              size={20}
              aria-hidden
              className={state.starred ? styles.starFilled : ''}
            />
          </Button>
        )}
      </header>
      <MessageThread
        conversationId={conversation.id}
        subject={conversation.subject ?? ''}
        messages={messages}
        currentUserId={(session?.user as { id?: string })?.id}
        onReplySent={fetchConversation}
      />
    </div>
  );
}
