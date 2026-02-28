'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, FormSection, FormActions, Input, Select, Button, Textarea } from '@/components/ui';
import styles from '../../admin.module.scss';

type UserOption = { id: string; email: string; name: string | null };

export default function AdminTicketsNewPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [requesterId, setRequesterId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [channel, setChannel] = useState('web');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users?limit=200')
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data: { users: UserOption[] }) => setUsers(data.users ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !requesterId) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim() || undefined,
          requesterId,
          assigneeId: assigneeId || undefined,
          channel,
          status: 'open',
          priority: 'medium',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to create ticket');
      }
      const ticket = await res.json();
      router.push(`/admin/tickets/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const userOptions = users.map((u) => ({ value: u.id, label: u.email || u.name || u.id }));
  const channelOptions = [
    { value: 'web', label: 'web' },
    { value: 'email', label: 'email' },
    { value: 'api', label: 'api' },
  ];

  return (
    <div>
      <h1 className={styles.pageTitle}>New ticket</h1>
      <p className={styles.pageDescription}>
        <Link href="/admin/tickets">← Back to tickets</Link>
      </p>
      {error && <p style={{ color: 'var(--theme-danger)', marginBottom: 'var(--unit-4)' }}>{error}</p>}
      <Form onSubmit={handleSubmit}>
        <FormSection>
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="Ticket subject"
          />
          <Select
            label="Requester"
            options={[{ value: '', label: '— Select user —' }, ...userOptions]}
            value={requesterId}
            onChange={setRequesterId}
            placeholder="Select user"
          />
          <Select
            label="Assignee (optional)"
            options={[{ value: '', label: '— Unassigned —' }, ...userOptions]}
            value={assigneeId}
            onChange={setAssigneeId}
          />
          <Select
            label="Channel"
            options={channelOptions}
            value={channel}
            onChange={setChannel}
          />
          <Textarea
            label="Body (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
          />
        </FormSection>
        <FormActions>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create ticket'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/tickets')}>
            Cancel
          </Button>
        </FormActions>
      </Form>
    </div>
  );
}
