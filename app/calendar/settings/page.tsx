'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button, Form, FormSection, FormRow, FormActions, Select } from '@/components/ui';
import styles from '../calendar.module.scss';

const BROWSER_TIMEZONE_VALUE = '';

function getTimezoneOptions(): { value: string; label: string }[] {
  const opts = [{ value: BROWSER_TIMEZONE_VALUE, label: 'Use browser / device time' }];
  try {
    const zones = Intl.supportedValuesOf('timeZone') as string[];
    zones.sort();
    zones.forEach((tz) => opts.push({ value: tz, label: tz }));
  } catch {
    opts.push(
      { value: 'America/New_York', label: 'America/New_York' },
      { value: 'America/Chicago', label: 'America/Chicago' },
      { value: 'America/Denver', label: 'America/Denver' },
      { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
      { value: 'Europe/London', label: 'Europe/London' },
      { value: 'Europe/Paris', label: 'Europe/Paris' },
      { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
      { value: 'UTC', label: 'UTC' }
    );
  }
  return opts;
}

const TIMEZONE_OPTIONS = getTimezoneOptions();

export default function CalendarSettingsPage() {
  const router = useRouter();
  const [timezone, setTimezone] = useState<string>(BROWSER_TIMEZONE_VALUE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/calendar/settings');
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        if (!cancelled) {
          setTimezone(data.timezone ?? BROWSER_TIMEZONE_VALUE);
        }
      } catch {
        if (!cancelled) setTimezone(BROWSER_TIMEZONE_VALUE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/calendar/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone: timezone === BROWSER_TIMEZONE_VALUE ? null : timezone,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save');
      }
      router.push('/calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.formPage}>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className={styles.formPage}>
      <Link href="/calendar" className={styles.settingsBackLink}>
        <ArrowLeft size={20} aria-hidden />
        Back to calendar
      </Link>
      <h1 className={styles.formPageTitle}>Calendar settings</h1>
      <Form onSubmit={handleSubmit}>
        <FormSection>
          <FormRow>
            <Select
              label="Time zone"
              options={TIMEZONE_OPTIONS}
              value={timezone}
              onChange={setTimezone}
              placeholder="Use browser time"
            />
          </FormRow>
          <p className={styles.settingsHint}>
            Events and “today” use this time zone. Choose “Use browser / device time” to follow your
            device’s current time zone.
          </p>
        </FormSection>
        {error && <p className={styles.settingsError} role="alert">{error}</p>}
        <FormActions>
          <Button type="submit" color="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Link href="/calendar">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </FormActions>
      </Form>
    </div>
  );
}
