'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Textarea, Form, FormSection, FormRow, FormActions } from '@/components/ui';
import styles from '../../../calendar.module.scss';

interface EventData {
  id: string;
  title: string;
  description: string | null;
  locationText: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  status: string;
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/calendar/events/${id}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (!cancelled) {
          setEvent(data);
          setTitle(data.title ?? '');
          setDescription(data.description ?? '');
          setLocationText(data.locationText ?? '');
          setAllDay(data.allDay ?? false);
          const s = new Date(data.startAt);
          const e = new Date(data.endAt);
          setStartDate(s.toISOString().slice(0, 10));
          setEndDate(e.toISOString().slice(0, 10));
          setStartTime(s.toTimeString().slice(0, 5));
          setEndTime(e.toTimeString().slice(0, 5));
        }
      } catch {
        if (!cancelled) setEvent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    const startAt = allDay
      ? new Date(startDate + 'T00:00:00').toISOString()
      : new Date(startDate + 'T' + startTime + ':00').toISOString();
    const endAt = allDay
      ? new Date(endDate + 'T23:59:59').toISOString()
      : new Date(endDate + 'T' + endTime + ':00').toISOString();
    if (new Date(startAt) >= new Date(endAt)) {
      setError('End must be after start.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          startAt,
          endAt,
          allDay,
          locationText: locationText.trim() || null,
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update');
      }
      router.push(`/calendar/events/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!id || !confirm('Cancel this event? Attendees will be notified.')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel event');
      router.push('/calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !id) {
    return (
      <main className={styles.formPage}>
        <div className={styles.emptyState}>{loading ? 'Loading…' : 'Invalid event'}</div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className={styles.formPage}>
        <div className={styles.emptyState}>Event not found.</div>
        <Link href="/calendar">
          <Button variant="outline">Back to Calendar</Button>
        </Link>
      </main>
    );
  }

  if (event.status === 'cancelled') {
    return (
      <main className={styles.formPage}>
        <p style={{ color: 'var(--color-danger)' }}>This event has been cancelled.</p>
        <Link href="/calendar">
          <Button variant="outline">Back to Calendar</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.formPage}>
      <Link href={`/calendar/events/${id}`} style={{ display: 'inline-block', marginBottom: 'var(--unit-3)', fontSize: '0.875rem' }}>
        ← Back to event
      </Link>
      <h1 className={styles.formPageTitle}>Edit event</h1>
      <Form onSubmit={handleSubmit}>
        <FormSection>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </FormRow>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>Start</label>
            <div style={{ display: 'flex', gap: 'var(--unit-2)', flexWrap: 'wrap' }}>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              {!allDay && <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />}
            </div>
          </FormRow>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>End</label>
            <div style={{ display: 'flex', gap: 'var(--unit-2)', flexWrap: 'wrap' }}>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              {!allDay && <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />}
            </div>
          </FormRow>
          <FormRow>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--unit-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
              All day
            </label>
          </FormRow>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>Location</label>
            <Input type="text" value={locationText} onChange={(e) => setLocationText(e.target.value)} />
          </FormRow>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </FormRow>
        </FormSection>
        {error && <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--unit-2)' }}>{error}</p>}
        <FormActions>
          <Button type="submit" color="primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
          <Link href={`/calendar/events/${id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </FormActions>
      </Form>
      <div style={{ marginTop: 'var(--unit-4)', paddingTop: 'var(--unit-4)', borderTop: '1px solid var(--color-divider)' }}>
        <Button color="danger" variant="outline" onClick={handleCancelEvent} disabled={submitting}>
          Cancel event
        </Button>
      </div>
    </main>
  );
}
