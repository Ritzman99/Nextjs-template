'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Select, Button } from '@/components/ui';
import styles from '../../admin.module.scss';

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string | null;
  requesterId: string | null;
  assigneeId: string | null;
  channel: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
};

type UserInfo = { id: string; email?: string; name?: string } | null;

export default function AdminTicketDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [requester, setRequester] = useState<UserInfo>(null);
  const [assignee, setAssignee] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [users, setUsers] = useState<{ id: string; email: string; name: string | null }[]>([]);

  const loadTicket = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/admin/tickets/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data: { ticket: Ticket; messages: Message[]; requester: UserInfo; assignee: UserInfo } | null) => {
        if (data) {
          setTicket(data.ticket);
          setMessages(data.messages);
          setRequester(data.requester);
          setAssignee(data.assignee);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    fetch('/api/admin/users?limit=100')
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data: { users: { id: string; email: string; name: string | null }[] }) => setUsers(data.users ?? []))
      .catch(() => {});
  }, []);

  async function handleUpdateField(field: string, value: string | null) {
    if (!ticket) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      if (res.ok) {
        setReplyBody('');
        loadTicket();
      }
    } finally {
      setSendingReply(false);
    }
  }

  if (loading) return <p className={styles.pageDescription}>Loading…</p>;
  if (notFound || !ticket) {
    return (
      <div>
        <h1 className={styles.pageTitle}>Ticket not found</h1>
        <Link href="/admin/tickets">← Back to tickets</Link>
      </div>
    );
  }

  const statusOptions = [
    { value: 'open', label: 'open' },
    { value: 'pending', label: 'pending' },
    { value: 'resolved', label: 'resolved' },
    { value: 'closed', label: 'closed' },
  ];
  const assigneeOptions = [{ value: '', label: '— Unassigned —' }, ...users.map((u) => ({ value: u.id, label: u.email || u.id }))];

  return (
    <div>
      <h1 className={styles.pageTitle}>{ticket.subject}</h1>
      <p className={styles.pageDescription}>
        <Link href="/admin/tickets">← Back to tickets</Link>
        {ticket.channel === 'email' && (
          <span style={{ marginLeft: 'var(--unit-4)', fontSize: '0.875rem', color: 'var(--theme-default-500)' }}>
            Email ticket
          </span>
        )}
      </p>

      <div className={styles.formSection}>
        <div className={styles.formRow} style={{ maxWidth: 'none', flexWrap: 'wrap' }}>
          <Select
            label="Status"
            options={statusOptions}
            value={ticket.status}
            onChange={(v) => handleUpdateField('status', v)}
          />
          <Select
            label="Assignee"
            options={assigneeOptions}
            value={ticket.assigneeId ?? ''}
            onChange={(v) => handleUpdateField('assigneeId', v || null)}
          />
          <div style={{ alignSelf: 'flex-end' }}>{saving ? 'Saving…' : ''}</div>
        </div>
        <p style={{ marginTop: 'var(--unit-2)', color: 'var(--theme-default-500)', fontSize: '0.875rem' }}>
          Requester: {requester ? (requester.email ?? requester.name ?? requester.id) : ticket.requesterId}
          {assignee && ` · Assignee: ${assignee.email ?? assignee.name ?? assignee.id}`}
        </p>
        {ticket.body && (
          <div className={styles.permissionSection} style={{ marginTop: 'var(--unit-4)', whiteSpace: 'pre-wrap' }}>
            {ticket.body}
          </div>
        )}
      </div>

      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Messages</h2>
        {messages.length === 0 ? (
          <p className={styles.pageDescription}>No replies yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {messages.map((msg) => (
              <li
                key={msg.id}
                className={styles.permissionSection}
                style={{ marginBottom: 'var(--unit-3)', padding: 'var(--unit-4)' }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--theme-default-500)', marginBottom: 'var(--unit-2)' }}>
                  {new Date(msg.createdAt).toLocaleString()}
                  {msg.isInternal && ' · Internal'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSendReply} style={{ marginTop: 'var(--unit-6)' }}>
          <div style={{ marginBottom: 'var(--unit-4)' }}>
            <label htmlFor="reply-body" className={styles.sectionTitle} style={{ display: 'block', marginBottom: 'var(--unit-2)' }}>Reply</label>
            <textarea
              id="reply-body"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Type your reply…"
              rows={4}
              style={{ width: '100%', padding: 'var(--unit-2) var(--unit-3)', border: '1px solid var(--theme-divider)', borderRadius: 'var(--unit-1)', background: 'var(--theme-content1)', color: 'var(--theme-foreground)', fontSize: '1rem' }}
            />
          </div>
          <div className={styles.formActions} style={{ marginTop: 'var(--unit-3)' }}>
            <Button type="submit" disabled={sendingReply || !replyBody.trim()}>
              {sendingReply ? 'Sending…' : 'Send reply'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
