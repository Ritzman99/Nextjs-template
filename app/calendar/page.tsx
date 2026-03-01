'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, List } from 'lucide-react';
import { Button } from '@/components/ui';
import styles from './calendar.module.scss';

type ViewType = 'month' | 'week' | 'agenda';

interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  locationText: string | null;
  status: string;
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: new Date(start.getTime()), end };
}

function getAgendaRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 13);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function groupEventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.startAt.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }
  return map;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [view, setView] = useState<ViewType>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    let start: Date;
    let end: Date;
    if (view === 'month') {
      const r = getMonthRange(cursor);
      start = r.start;
      end = r.end;
    } else if (view === 'week') {
      const r = getWeekRange(cursor);
      start = r.start;
      end = r.end;
    } else {
      const r = getAgendaRange(cursor);
      start = r.start;
      end = r.end;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [view, cursor]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const prev = () => {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 14);
    setCursor(d);
  };

  const next = () => {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 14);
    setCursor(d);
  };

  const today = () => setCursor(new Date());

  let titleLabel = '';
  if (view === 'month') {
    titleLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (view === 'week') {
    const { start, end } = getWeekRange(cursor);
    titleLabel = `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    titleLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const byDay = groupEventsByDay(events);
  const todayKey = formatDateKey(new Date());

  return (
    <>
      <div className={styles.toolbar}>
        <h1 className={styles.toolbarTitle}>Calendar</h1>
        <div className={styles.navGroup}>
          <Button variant="ghost" size="sm" onClick={prev} aria-label="Previous">
            <ChevronLeft size={20} />
          </Button>
          <Button variant="ghost" size="sm" onClick={next} aria-label="Next">
            <ChevronRight size={20} />
          </Button>
          <Button variant="outline" size="sm" onClick={today}>
            Today
          </Button>
        </div>
        <span style={{ minWidth: 220, textAlign: 'center', fontWeight: 500 }}>{titleLabel}</span>
        <div className={styles.viewGroup}>
          <Button
            variant={view === 'month' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => setView('month')}
            aria-pressed={view === 'month'}
          >
            <CalendarDays size={18} />
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => setView('week')}
            aria-pressed={view === 'week'}
          >
            Week
          </Button>
          <Button
            variant={view === 'agenda' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => setView('agenda')}
            aria-pressed={view === 'agenda'}
          >
            <List size={18} />
            Agenda
          </Button>
        </div>
        <Link href="/calendar/new">
          <Button color="primary" size="sm">
            <Plus size={18} />
            New event
          </Button>
        </Link>
      </div>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.emptyState}>Loading…</div>
        ) : view === 'month' ? (
          <MonthView cursor={cursor} events={events} byDay={byDay} todayKey={todayKey} />
        ) : view === 'week' ? (
          <WeekView cursor={cursor} events={events} todayKey={todayKey} />
        ) : (
          <AgendaView events={events} byDay={byDay} />
        )}
      </main>
    </>
  );
}

function MonthView({
  cursor,
  events,
  byDay,
  todayKey,
}: {
  cursor: Date;
  events: CalendarEvent[];
  byDay: Map<string, CalendarEvent[]>;
  todayKey: string;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const rows = Math.ceil(cells.length / 7);

  return (
    <div className={styles.monthGrid}>
      {DAY_NAMES.map((day) => (
        <div key={day} className={styles.monthDayHeader}>
          {day}
        </div>
      ))}
      {Array.from({ length: rows * 7 }, (_, i) => {
        const cell = cells[i];
        const dateKey =
          cell !== null
            ? formatDateKey(new Date(year, month, cell))
            : null;
        const dayEvents = dateKey ? byDay.get(dateKey) ?? [] : [];
        const isToday = dateKey === todayKey;
        return (
          <div
            key={i}
            className={styles.monthDayCell}
            data-today={isToday || undefined}
          >
            {cell !== null && (
              <>
                <div className={styles.monthDayNumber}>{cell}</div>
                <div className={styles.monthDayEvents}>
                  {dayEvents.slice(0, 3).map((e) => (
                    <Link
                      key={e.id}
                      href={`/calendar/events/${e.id}`}
                      className={styles.monthEvent}
                    >
                      {e.allDay ? 'All day' : new Date(e.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}{' '}
                      {e.title}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-default-500)' }}>
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekView({
  cursor,
  events,
  todayKey,
}: {
  cursor: Date;
  events: CalendarEvent[];
  todayKey: string;
}) {
  const { start } = getWeekRange(cursor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const byDayAndHour = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    if (e.allDay) continue;
    const d = new Date(e.startAt);
    const key = `${formatDateKey(d)}-${d.getHours()}`;
    if (!byDayAndHour.has(key)) byDayAndHour.set(key, []);
    byDayAndHour.get(key)!.push(e);
  }

  return (
    <div className={styles.weekGrid}>
      <div className={styles.weekTimeCell} />
      {days.map((d) => (
        <div key={d.getTime()} className={styles.weekDayHeader}>
          {d.toLocaleDateString('en-US', { weekday: 'short' })} {d.getDate()}
        </div>
      ))}
      {hours.map((hour) => (
        <React.Fragment key={hour}>
          <div className={styles.weekTimeCell}>
            {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
          </div>
          {days.map((d) => {
            const dateKey = formatDateKey(d);
            const dayEvents = events.filter((e) => {
              const start = new Date(e.startAt);
              return formatDateKey(start) === dateKey && !e.allDay && start.getHours() === hour;
            });
            return (
              <div key={`${dateKey}-${hour}`} className={styles.weekDaySlot}>
                {dayEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/calendar/events/${e.id}`}
                    className={styles.weekEvent}
                    style={{
                      top: 2,
                      height: Math.max(20, 48 - 2),
                    }}
                  >
                    {e.title}
                  </Link>
                ))}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

function AgendaView({
  events,
  byDay,
}: {
  events: CalendarEvent[];
  byDay: Map<string, CalendarEvent[]>;
}) {
  const sortedKeys = Array.from(byDay.keys()).sort();
  if (sortedKeys.length === 0) {
    return <div className={styles.emptyState}>No events in this range.</div>;
  }
  return (
    <ul className={styles.agendaList}>
      {sortedKeys.map((key) => (
        <li key={key} className={styles.agendaDay}>
          <div className={styles.agendaDayHeader}>
            {new Date(key + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          {(byDay.get(key) ?? []).map((e) => (
            <Link
              key={e.id}
              href={`/calendar/events/${e.id}`}
              className={styles.agendaEvent}
            >
              <span className={styles.agendaEventTime}>
                {e.allDay
                  ? 'All day'
                  : `${new Date(e.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${new Date(e.endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
              </span>
              {e.title}
            </Link>
          ))}
        </li>
      ))}
    </ul>
  );
}
