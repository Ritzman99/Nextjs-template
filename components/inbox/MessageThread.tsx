'use client';

import { useState } from 'react';
import { Form, FormActions, Button, RichTextEditor } from '@/components/ui';
import { Send } from 'lucide-react';
import { sanitizeHtml, isHtml } from '@/lib/sanitizeHtml';
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

  function isReplyEmpty(html: string): boolean {
    const t = html?.trim() ?? '';
    return !t || t === '<p></p>' || t === '<p><br></p>';
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (isReplyEmpty(replyBody) || sending) return;
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

  function formatTo(msg: MessageItem): string {
    if (!msg.toRefs?.length) return '—';
    return msg.toRefs
      .map((r) => r.display?.name || r.display?.email || 'Unknown')
      .join(', ');
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messageList}>
        {messages.map((msg) => (
          <div key={msg.id} className={styles.messageBlock}>
            <div className={styles.messageHeader}>
              <span><strong>From:</strong> {msg.fromDisplay?.name || msg.fromDisplay?.email || 'Unknown'}</span>
              <span><strong>To:</strong> {formatTo(msg)}</span>
              <span><strong>Date:</strong> {formatTime(msg.createdAt)}</span>
            </div>
            {isHtml(msg.body) ? (
              <div
                className={styles.messageBodyRich}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.body) }}
              />
            ) : (
              <div className={styles.messageBody}>{msg.body}</div>
            )}
          </div>
        ))}
      </div>
      <Form onSubmit={handleReply} className={styles.replyForm}>
        <RichTextEditor
          value={replyBody}
          onChange={setReplyBody}
          placeholder="Write a reply..."
          disabled={sending}
          minHeight="100px"
        />
        <FormActions className={styles.replyFormActions}>
          <Button type="submit" color="primary" size="sm" disabled={sending || isReplyEmpty(replyBody)}>
            <Send size={16} aria-hidden />
            Send
          </Button>
        </FormActions>
      </Form>
    </div>
  );
}
