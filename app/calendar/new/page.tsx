'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, Form, FormSection, FormRow, FormActions } from '@/components/ui';
import styles from '../calendar.module.scss';

interface CalendarOption {
  id: string;
  name: string;
  isDefault: boolean;
}

export default function NewEventPage() {
  const router = useRouter();
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [calendarId, setCalendarId] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');
  const [attendeeLines, setAttendeeLines] = useState('');
  const [createThread, setCreateThread] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/calendar/calendars');
        if (!res.ok) throw new Error('Failed to load calendars');
        const data = await res.json();
        const list = (data.calendars ?? []).map((c: { id: string; name: string; isDefault: boolean }) => ({
          id: c.id,
          name: c.name,
          isDefault: c.isDefault,
        }));
        if (!cancelled) {
          setCalendars(list);
          if (list.length > 0 && !calendarId) {
            const defaultCal = list.find((c: CalendarOption) => c.isDefault) ?? list[0];
            setCalendarId(defaultCal.id);
          }
        }
      } catch {
        if (!cancelled) setCalendars([]);
      } finally {
        if (!cancelled) setLoadingCalendars(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (!startDate) setStartDate(today);
    if (!endDate) setEndDate(today);
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!calendarId || !title.trim()) {
      setError('Title is required.');
      return;
    }
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
      const attendeeIdentifiers = attendeeLines
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId,
          title: title.trim(),
          startAt,
          endAt,
          allDay,
          locationText: locationText.trim() || null,
          description: description.trim() || null,
          attendeeIdentifiers,
          createConversationThread: createThread,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create event');
      router.push(`/calendar/events/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCalendars) {
    return (
      <main className={styles.formPage}>
        <div className={styles.emptyState}>Loading…</div>
      </main>
    );
  }

  return (
    <main className={styles.formPage}>
      <Link href="/calendar" style={{ display: 'inline-block', marginBottom: 'var(--unit-3)', fontSize: '0.875rem' }}>
        ← Back to Calendar
      </Link>
      <h1 className={styles.formPageTitle}>New event</h1>
      <Form onSubmit={handleSubmit}>
        <FormSection>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>Calendar</label>
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              required
              style={{ padding: 'var(--unit-2)', borderRadius: 'var(--unit-1)', minWidth: 200 }}
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormRow>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </FormRow>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>Start</label>
            <div style={{ display: 'flex', gap: 'var(--unit-2)', flexWrap: 'wrap', alignItems: 'center' }}>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              {!allDay && (
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              )}
            </div>
          </FormRow>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>End</label>
            <div style={{ display: 'flex', gap: 'var(--unit-2)', flexWrap: 'wrap', alignItems: 'center' }}>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              {!allDay && (
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              )}
            </div>
          </FormRow>
          <FormRow>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--unit-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
              />
              All day
            </label>
          </FormRow>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>Location</label>
            <Input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="Address or place"
            />
          </FormRow>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </FormRow>
          <FormRow>
            <label style={{ display: 'block', marginBottom: 'var(--unit-1)', fontWeight: 500 }}>Attendees</label>
            <Textarea
              value={attendeeLines}
              onChange={(e) => setAttendeeLines(e.target.value)}
              placeholder="One email or username per line"
              rows={2}
            />
          </FormRow>
          <FormRow>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--unit-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={createThread}
                onChange={(e) => setCreateThread(e.target.checked)}
              />
              Create conversation thread for this event
            </label>
          </FormRow>
        </FormSection>
        {error && (
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--unit-2)' }}>{error}</p>
        )}
        <FormActions>
          <Button type="submit" color="primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create event'}
          </Button>
          <Link href="/calendar">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </FormActions>
      </Form>
    </main>
  );
}
