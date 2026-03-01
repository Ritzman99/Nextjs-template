'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import styles from '../../calendar.module.scss';

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  locationText: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  timezone: string | null;
  status: string;
  conversationId: string | null;
  myRsvp: string | null;
  canEdit?: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/calendar/events/${id}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (!cancelled) setEvent(data);
      } catch {
        if (!cancelled) setEvent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const setRsvp = async (value: 'yes' | 'no' | 'maybe') => {
    if (!id) return;
    setRsvpLoading(true);
    try {
      const res = await fetch(`/api/calendar/events/${id}/rsvp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvp: value }),
      });
      if (!res.ok) throw new Error('Failed to update RSVP');
      setEvent((prev) => (prev ? { ...prev, myRsvp: value } : null));
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading || !id) {
    return (
      <main className={styles.eventDetail}>
        <div className={styles.emptyState}>{loading ? 'Loading…' : 'Invalid event'}</div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className={styles.eventDetail}>
        <div className={styles.emptyState}>Event not found.</div>
        <Link href="/calendar">
          <Button variant="outline">Back to Calendar</Button>
        </Link>
      </main>
    );
  }

  const timeStr = event.allDay
    ? new Date(event.startAt).toLocaleDateString('en-US', { dateStyle: 'long' })
    : `${new Date(event.startAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} – ${new Date(event.endAt).toLocaleString('en-US', { timeStyle: 'short' })}`;

  return (
    <main className={styles.eventDetail}>
      <Link href="/calendar" style={{ display: 'inline-block', marginBottom: 'var(--unit-3)', fontSize: '0.875rem' }}>
        ← Back to Calendar
      </Link>
      {event.status === 'cancelled' && (
        <p style={{ color: 'var(--color-danger)', fontWeight: 500, marginBottom: 'var(--unit-2)' }}>
          This event has been cancelled.
        </p>
      )}
      <h1 className={styles.eventDetailTitle}>{event.title}</h1>
      <div className={styles.eventDetailMeta}>{timeStr}</div>
      {event.locationText && (
        <div className={styles.eventDetailMeta}>Location: {event.locationText}</div>
      )}
      {event.description && (
        <p style={{ marginTop: 'var(--unit-2)', whiteSpace: 'pre-wrap' }}>{event.description}</p>
      )}

      {event.status !== 'cancelled' && event.myRsvp !== null && (
        <div className={styles.rsvpGroup}>
          <span style={{ marginRight: 'var(--unit-2)', fontSize: '0.875rem' }}>Your response:</span>
          <Button
            size="sm"
            color={event.myRsvp === 'yes' ? 'success' : 'default'}
            variant={event.myRsvp === 'yes' ? 'solid' : 'outline'}
            onClick={() => setRsvp('yes')}
            disabled={rsvpLoading}
          >
            Yes
          </Button>
          <Button
            size="sm"
            color={event.myRsvp === 'maybe' ? 'secondary' : 'default'}
            variant={event.myRsvp === 'maybe' ? 'solid' : 'outline'}
            onClick={() => setRsvp('maybe')}
            disabled={rsvpLoading}
          >
            Maybe
          </Button>
          <Button
            size="sm"
            color={event.myRsvp === 'no' ? 'danger' : 'default'}
            variant={event.myRsvp === 'no' ? 'solid' : 'outline'}
            onClick={() => setRsvp('no')}
            disabled={rsvpLoading}
          >
            No
          </Button>
        </div>
      )}

      <div className={styles.eventDetailActions}>
        {event.canEdit && (
          <Link href={`/calendar/events/${event.id}/edit`}>
            <Button variant="outline" size="sm">
              Edit event
            </Button>
          </Link>
        )}
        {event.conversationId && (
          <Link href={`/inbox/conversations/${event.conversationId}`}>
            <Button variant="outline" size="sm">
              View conversation
            </Button>
          </Link>
        )}
        <Link href="/calendar">
          <Button variant="ghost" size="sm">
            Back to Calendar
          </Button>
        </Link>
      </div>
    </main>
  );
}
