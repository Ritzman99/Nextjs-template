'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Form,
  FormSection,
  FormRow,
  FormActions,
  Select,
  Switch,
  Card,
  Alert,
  ButtonGroup,
  TagInput,
} from '@/components/ui';
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
  const [attendeeIdentifiers, setAttendeeIdentifiers] = useState<string[]>([]);
  const [createThread, setCreateThread] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/calendar/calendars');
        if (!res.ok) throw new Error('Failed to load calendars');
        const data = await res.json();
        const list = (data.calendars ?? []).map(
          (c: { id: string; name: string; isDefault: boolean }) => ({
            id: c.id,
            name: c.name,
            isDefault: c.isDefault,
          })
        );
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
    return () => {
      cancelled = true;
    };
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
          attendeeIdentifiers: attendeeIdentifiers.filter(Boolean),
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
        <div className={styles.newEventPage}>
          <div className={styles.emptyState}>Loading…</div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.formPage}>
      <div className={styles.newEventPage}>
        <Link href="/calendar" className={styles.settingsBackLink}>
          <ArrowLeft size={20} aria-hidden />
          Back to calendar
        </Link>

        <Card
          className={styles.newEventCard}
          header={
            <>
              <div className={styles.newEventHeader}>
                <h1 className={styles.newEventTitle}>New Event</h1>
                <p className={styles.newEventSubtitle}>Create an event and invite others.</p>
              </div>
              <div className={styles.newEventHeaderDivider} aria-hidden />
            </>
          }
        >
          <Form onSubmit={handleSubmit} className={styles.newEventForm}>
            <div className={styles.newEventFormGrid}>
              <div className={styles.newEventFormLeft}>
                <FormSection title="Details">
                  <FormRow fullWidth>
                    <Select
                      label="Calendar"
                      options={calendars.map((c) => ({ value: c.id, label: c.name }))}
                      value={calendarId}
                      onChange={setCalendarId}
                      placeholder="Select calendar"
                      aria-label="Calendar"
                    />
                  </FormRow>
                  <FormRow fullWidth>
                    <Input
                      type="text"
                      label="Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Event title"
                      required
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="When">
                  <div className={styles.whenSection}>
                    <div className={styles.whenRow}>
                      <div className={styles.whenGroup}>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                          aria-label="Start date"
                        />
                        {!allDay && (
                          <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            aria-label="Start time"
                          />
                        )}
                      </div>
                      <span className={styles.whenArrow} aria-hidden>
                        →
                      </span>
                      <div className={styles.whenGroup}>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                          aria-label="End date"
                        />
                        {!allDay && (
                          <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            aria-label="End time"
                          />
                        )}
                      </div>
                      <div className={styles.whenAllDay}>
                        <Switch
                          label="All day"
                          checked={allDay}
                          onChange={(e) => setAllDay(e.target.checked)}
                          className={styles.switchPill}
                        />
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Location">
                  <FormRow fullWidth>
                    <Input
                      type="text"
                      label="Location"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      placeholder="Address or place"
                    />
                  </FormRow>
                </FormSection>
              </div>

              <div className={styles.newEventFormRight}>
                <FormSection title="Description">
                  <FormRow fullWidth>
                    <Textarea
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add details, agenda, or notes…"
                      rows={5}
                      className={styles.descriptionTextarea}
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Attendees & options">
              <FormRow fullWidth>
                <TagInput
                  label="Attendees"
                  value={attendeeIdentifiers}
                  onChange={setAttendeeIdentifiers}
                  placeholder="Add email or username…"
                />
              </FormRow>
              <div className={styles.threadOptionCard}>
                <div className={styles.threadOptionRow}>
                  <MessageCircle size={20} className={styles.threadOptionIcon} aria-hidden />
                  <Switch
                    label="Create conversation thread for this event"
                    checked={createThread}
                    onChange={(e) => setCreateThread(e.target.checked)}
                  />
                </div>
                <p className={styles.threadOptionDescription}>
                  Allow comments and updates in a thread.
                </p>
              </div>
              </FormSection>
              </div>
            </div>

            {error && (
              <Alert color="danger" variant="soft" className={styles.formAlert}>
                {error}
              </Alert>
            )}

            <FormActions>
              <ButtonGroup attached>
                <Button type="submit" color="primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create event'}
                </Button>
                <Link href="/calendar">
                  <Button type="button" variant="ghost" className={styles.cancelBtn}>
                    Cancel
                  </Button>
                </Link>
              </ButtonGroup>
            </FormActions>
          </Form>
        </Card>
      </div>
    </main>
  );
}
