'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { MessageThread, InboxSidebarToggle, LabelPicker, ComposeForm } from '@/components/inbox';
import type { MessageItem, ToListItem } from '@/components/inbox';
import styles from '../../inbox.module.scss';

const FOLDER_LABELS: Record<string, string> = {
  inbox: 'Inbox',
  sent: 'Sent',
  starred: 'Starred',
  draft: 'Draft',
  trash: 'Trash',
  friend_requests: 'Friend requests',
  event_invites: 'Event invites',
};

export default function InboxConversationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const id = params?.id as string | undefined;
  const folder = searchParams?.get('folder') ?? 'inbox';
  const backHref = folder === 'inbox' ? '/inbox' : `/inbox?folder=${folder}`;
  const backLabel = FOLDER_LABELS[folder] ?? 'Inbox';

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
  const [movingToTrash, setMovingToTrash] = useState(false);
  const [deletingPermanent, setDeletingPermanent] = useState(false);
  const [acceptingFriend, setAcceptingFriend] = useState(false);
  const [decliningFriend, setDecliningFriend] = useState(false);

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
    if (!id || !session?.user?.id || state?.folder === 'draft') return;
    fetch(`/api/inbox/conversations/${id}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readAt: new Date().toISOString() }),
    }).catch(() => {});
  }, [id, session?.user?.id, state?.folder]);

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

  async function moveToTrash() {
    if (!id || movingToTrash) return;
    setMovingToTrash(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'trash' }),
      });
      if (res.ok) router.push(backHref);
    } finally {
      setMovingToTrash(false);
    }
  }

  async function deletePermanently() {
    if (!id || deletingPermanent) return;
    setDeletingPermanent(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/inbox?folder=trash');
    } finally {
      setDeletingPermanent(false);
    }
  }

  async function acceptFriendRequest() {
    if (!id || acceptingFriend) return;
    setAcceptingFriend(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${id}/accept-friend-request`, {
        method: 'POST',
      });
      if (res.ok) router.push('/contacts');
      else {
        const data = await res.json();
        alert(data.error ?? 'Failed to accept');
      }
    } finally {
      setAcceptingFriend(false);
    }
  }

  async function declineFriendRequest() {
    if (!id || decliningFriend) return;
    setDecliningFriend(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${id}/decline-friend-request`, {
        method: 'POST',
      });
      if (res.ok) router.push('/inbox?folder=friend_requests');
    } finally {
      setDecliningFriend(false);
    }
  }

  if (!id) {
    router.replace(backHref);
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
        <Link href={backHref}>Back to {backLabel}</Link>
      </div>
    );
  }

  const isDraft = state?.folder === 'draft';
  const firstMessage = messages[0];
  const draftInitialTo: ToListItem[] = firstMessage?.toRefs
    ? firstMessage.toRefs.map((t) => ({
        id: t.ref,
        type: t.type as 'user' | 'contact',
        displayName: t.display?.name || t.display?.email || t.ref,
        identifier: t.display?.email || t.display?.id || t.ref,
      }))
    : [];

  if (isDraft) {
    return (
      <div className={styles.detailPanel}>
        <header className={styles.detailHeader}>
          <InboxSidebarToggle />
          <Link
            href={backHref}
            className={styles.detailBack}
            aria-label={`Back to ${backLabel}`}
          >
            <ArrowLeft size={20} aria-hidden />
          </Link>
          <h1 className={styles.detailSubject}>Edit draft</h1>
        </header>
        <ComposeForm
          draftId={conversation.id}
          initialSubject={conversation.subject ?? ''}
          initialBody={firstMessage?.body ?? ''}
          initialTo={draftInitialTo}
          onSent={(data) => router.push(`/inbox/conversations/${data.id}?folder=sent`)}
          onCancel={() => router.push(backHref)}
          onDraftSaved={() => fetchConversation()}
        />
      </div>
    );
  }

  const isFriendRequestRecipient =
    conversation.type === 'friend_request' && state?.folder === 'friend_requests';

  return (
    <div className={styles.detailPanel}>
      <header className={styles.detailHeader}>
        <InboxSidebarToggle />
        <Link
          href={backHref}
          className={styles.detailBack}
          aria-label={`Back to ${backLabel}`}
        >
          <ArrowLeft size={20} aria-hidden />
        </Link>
        <h1 className={styles.detailSubject}>
          {conversation.subject || '(No subject)'}
        </h1>
        {state && !isFriendRequestRecipient && (
          <>
            <LabelPicker
              conversationId={conversation.id}
              labels={state.labels}
              onLabelsChange={(labels) => setState((s) => (s ? { ...s, labels } : s))}
            />
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
            {folder !== 'trash' ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={moveToTrash}
                disabled={movingToTrash}
                aria-label="Move to trash"
              >
                <Trash2 size={20} aria-hidden />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={deletePermanently}
                disabled={deletingPermanent}
                aria-label="Delete permanently"
              >
                {deletingPermanent ? 'Deleting…' : 'Delete permanently'}
              </Button>
            )}
          </>
        )}
        {isFriendRequestRecipient && (
          <div className={styles.friendRequestActions}>
            <Button
              type="button"
              color="primary"
              onClick={acceptFriendRequest}
              disabled={acceptingFriend}
            >
              {acceptingFriend ? 'Accepting…' : 'Accept'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={declineFriendRequest}
              disabled={decliningFriend}
            >
              {decliningFriend ? 'Declining…' : 'Decline'}
            </Button>
          </div>
        )}
      </header>
      <MessageThread
        conversationId={conversation.id}
        subject={conversation.subject ?? ''}
        messages={messages}
        currentUserId={(session?.user as { id?: string })?.id}
        onReplySent={fetchConversation}
        hideReply={isFriendRequestRecipient}
      />
    </div>
  );
}
