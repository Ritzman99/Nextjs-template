'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { LabelPicker } from './LabelPicker';
import styles from './ConversationList.module.scss';

export interface ConversationItem {
  id: string;
  type: string;
  subject: string;
  updatedAt: string;
  folder: string;
  readAt: string | null;
  starred: boolean;
  labels: string[];
  snippet: string;
  senderName: string;
}

export interface ConversationListProps {
  conversations: ConversationItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
  currentFolder: string;
  selectedId?: string | null;
  /** When labels change from the list row, call with conversation id and new labels (e.g. to update local state). */
  onLabelsChange?: (id: string, labels: string[]) => void;
  /** When user moves a conversation to trash from the list, call with id (e.g. refetch or remove from list). */
  onMoveToTrash?: (id: string) => void;
  /** When user permanently deletes from trash, call with id (e.g. refetch or remove from list). */
  onDeletePermanent?: (id: string) => void;
}

function formatTime(updatedAt: string): string {
  const d = new Date(updatedAt);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function RowTrashButton({
  conversationId,
  onMoved,
}: {
  conversationId: string;
  onMoved?: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'trash' }),
      });
      if (res.ok) onMoved?.(conversationId);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      aria-label="Move to trash"
      className={styles.rowActionBtn}
    >
      <Trash2 size={18} aria-hidden />
    </Button>
  );
}

function RowDeletePermanentButton({
  conversationId,
  onDeleted,
}: {
  conversationId: string;
  onDeleted?: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}`, { method: 'DELETE' });
      if (res.ok) onDeleted?.(conversationId);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      aria-label="Delete permanently"
      className={styles.rowActionBtn}
    >
      {loading ? '…' : 'Delete'}
    </Button>
  );
}

export function ConversationList({
  conversations,
  pagination,
  currentFolder,
  selectedId,
  onLabelsChange,
  onMoveToTrash,
  onDeletePermanent,
}: ConversationListProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.list}>
        {conversations.length === 0 ? (
          <div className={styles.emptyState}>
            {currentFolder === 'inbox' && 'No messages in inbox.'}
            {currentFolder === 'sent' && 'No sent messages.'}
            {currentFolder === 'starred' && 'No starred messages.'}
            {currentFolder === 'draft' && 'No drafts.'}
            {currentFolder === 'trash' && 'Trash is empty.'}
            {currentFolder === 'friend_requests' && 'No friend requests.'}
            {!['inbox', 'sent', 'starred', 'draft', 'trash', 'friend_requests'].includes(currentFolder) && 'No conversations.'}
          </div>
        ) : (
          conversations.map((c) => {
            const isUnread = !c.readAt;
            return (
            <Link
              key={c.id}
              href={
                currentFolder === 'inbox'
                  ? `/inbox/conversations/${c.id}`
                  : `/inbox/conversations/${c.id}?folder=${currentFolder}`
              }
              className={`${styles.row} ${isUnread ? styles.rowUnread : ''} ${selectedId === c.id ? styles.rowSelected : ''}`}
              aria-label={isUnread ? 'Unread conversation' : undefined}
            >
              <span className={isUnread ? styles.unreadDot : styles.unreadDotPlaceholder} aria-hidden />
              <span className={styles.starWrap}>
                <Star
                  size={18}
                  aria-hidden
                  className={c.starred ? styles.starFilled : styles.starOutline}
                />
              </span>
              <span className={styles.sender}>{c.senderName || 'Unknown'}</span>
              {(c.type === 'friend_request' || c.labels.length > 0) && (
                <span className={styles.labels}>
                  {c.type === 'friend_request' && (
                    <span className={styles.labelChip}>Friend request</span>
                  )}
                  {c.labels.slice(0, 2).map((l) => (
                    <span key={l} className={styles.labelChip}>
                      {l}
                    </span>
                  ))}
                </span>
              )}
              <span className={styles.subject}>{c.subject || '(No subject)'}</span>
              <span
                className={styles.rowActions}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                role="presentation"
              >
                <LabelPicker
                  conversationId={c.id}
                  labels={c.labels}
                  onLabelsChange={(labels) => onLabelsChange?.(c.id, labels)}
                />
                {currentFolder !== 'trash' ? (
                  <RowTrashButton conversationId={c.id} onMoved={onMoveToTrash} />
                ) : (
                  <RowDeletePermanentButton conversationId={c.id} onDeleted={onDeletePermanent} />
                )}
              </span>
              <span className={styles.time}>{formatTime(c.updatedAt)}</span>
            </Link>
            );
          })
        )}
      </div>
      {pagination.total > 0 && (
        <div className={styles.pagination}>
          Showing {((pagination.page - 1) * pagination.limit) + 1}–
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </div>
      )}
    </div>
  );
}
