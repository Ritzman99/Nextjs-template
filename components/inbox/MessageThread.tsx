'use client';

import { useState } from 'react';
import { Form, FormActions, Button, Textarea } from '@/components/ui';
import { Send } from 'lucide-react';
import styles from './MessageThread.module.scss';

export interface MessageItem {
  id: string;
  fromType: string;
  fromRef: string;
  fromDisplay: { id: string; name: string; email: string };
  toRefs: Array<{
    type: string;
    ref: string;
    display: { id: string; name: string; email: string };
  }>;
  body: string;
  inReplyToId: string | null;
  createdAt: string;
}

export interface MessageThreadProps {
  conversationId: string;
  subject: string;
  messages: MessageItem[];
  currentUserId?: string | null;
  onReplySent: () => void;
}

export function MessageThread({
  conversationId,
  subject,
  messages,
  currentUserId,
  onReplySent,
}: MessageThreadProps) {
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      if (res.ok) {
        setReplyBody('');
        onReplySent();
      }
    } catch {
      // ignore
    }
    setSending(false);
  }

  function formatTime(createdAt: string): string {
    return new Date(createdAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messageList}>
        {messages.map((msg) => {
          const isOwn = msg.fromDisplay?.id === currentUserId || msg.fromRef === currentUserId;
          return (
            <div
              key={msg.id}
              className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleFrom}`}
            >
              <div className={styles.meta}>
                {msg.fromDisplay?.name || msg.fromDisplay?.email || 'Unknown'} · {formatTime(msg.createdAt)}
              </div>
              <div className={styles.body}>{msg.body}</div>
            </div>
          );
        })}
      </div>
      <Form onSubmit={handleReply} className={styles.replyForm}>
        <Textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder="Write a reply..."
          rows={3}
          disabled={sending}
        />
        <FormActions>
          <Button type="submit" color="primary" size="sm" disabled={sending || !replyBody.trim()}>
            <Send size={16} aria-hidden />
            Send
          </Button>
        </FormActions>
      </Form>
    </div>
  );
}
