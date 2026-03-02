'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui';
import styles from './calendar.module.scss';

const MOBILE_BREAKPOINT = 768;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = () => setIsMobile(mql.matches);
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

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

/** Format date as YYYY-MM-DD in local (browser) time for display and today comparison. */
function formatDateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format the calendar date (YYYY-MM-DD) for a given moment in a specific IANA timezone. */
function formatDateKeyInZone(d: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const day = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${day}`;
}

function groupEventsByDay(
  events: CalendarEvent[],
  timezone: string | null = null
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  const toKey = timezone
    ? (d: Date) => formatDateKeyInZone(d, timezone)
    : formatDateKeyLocal;
  for (const e of events) {
    const key = toKey(new Date(e.startAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }
  return map;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarPage() {
  const isMobile = useIsMobile();
  const [view, setView] = useState<ViewType>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    fetch('/api/calendar/settings')
      .then((res) => (res.ok ? res.json() : { timezone: null }))
      .then((data) => {
        if (!cancelled) {
          setTimezone(data.timezone ?? null);
          setSettingsLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSettingsLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

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

  const byDay = groupEventsByDay(events, settingsLoaded ? timezone : null);
  const now = new Date();
  const todayKey =
    settingsLoaded && timezone
      ? formatDateKeyInZone(now, timezone)
      : formatDateKeyLocal(now);

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.calendarLabel}>Calendar</span>
          <div className={styles.navGroup} role="group" aria-label="Month navigation">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={prev}
              aria-label="Previous month"
              className={styles.navArrow}
            >
              <ChevronLeft size={18} aria-hidden />
            </Button>
            <h2 className={styles.monthHero}>{titleLabel}</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={next}
              aria-label="Next month"
              className={styles.navArrow}
            >
              <ChevronRight size={18} aria-hidden />
            </Button>
          </div>
        </div>
        <div className={styles.toolbarCenter} role="group" aria-label="Calendar view">
          <div className={styles.segmentedControl}>
            {(['month', 'week', 'agenda'] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={styles.segment}
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.toolbarRight}>
          <Button variant="outline" size="sm" onClick={today} className={styles.todayBtn}>
            Today
          </Button>
          <Link href="/calendar/settings" className={styles.settingsLink} aria-label="Calendar settings">
            <Button variant="ghost" size="sm" className={styles.settingsBtn}>
              <Settings size={16} aria-hidden />
            </Button>
          </Link>
          <Link href="/calendar/new" className={styles.newEventLink}>
            <Button color="primary" size="sm" className={styles.newEventBtn}>
              <Plus size={18} aria-hidden />
              <span className={styles.newEventLabel}>New event</span>
            </Button>
          </Link>
        </div>
      </div>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.emptyState}>Loading…</div>
        ) : view === 'month' ? (
          isMobile ? (
            <MonthViewMobile cursor={cursor} byDay={byDay} todayKey={todayKey} />
          ) : (
            <MonthView cursor={cursor} events={events} byDay={byDay} todayKey={todayKey} />
          )
        ) : view === 'week' ? (
          isMobile ? (
            <WeekViewMobile cursor={cursor} events={events} todayKey={todayKey} />
          ) : (
            <WeekView cursor={cursor} events={events} todayKey={todayKey} />
          )
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
      {DAY_NAMES.map((day, i) => (
        <div key={day} className={styles.monthDayHeader}>
          <span className={styles.dayLabel} data-short={DAY_NAMES_SHORT[i]}>
            {day}
          </span>
        </div>
      ))}
      {Array.from({ length: rows * 7 }, (_, i) => {
        const cell = cells[i] ?? null;
        const dateKey =
          cell !== null
            ? formatDateKeyLocal(new Date(year, month, cell))
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
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <Link
                      key={e.id}
                      href={`/calendar/events/${e.id}`}
                      className={idx === 2 ? `${styles.monthEvent} ${styles.monthEventThird}` : styles.monthEvent}
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
    const key = `${formatDateKeyLocal(d)}-${d.getHours()}`;
    if (!byDayAndHour.has(key)) byDayAndHour.set(key, []);
    byDayAndHour.get(key)!.push(e);
  }

  return (
    <div className={styles.weekGrid}>
      <div className={styles.weekTimeCell} />
      {days.map((d) => {
        const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' })[0];
        const dateKey = formatDateKeyLocal(d);
        const isToday = dateKey === todayKey;
        return (
          <div key={d.getTime()} className={styles.weekDayHeader} data-today={isToday || undefined}>
            <span className={styles.weekDayFull}>
              {d.toLocaleDateString('en-US', { weekday: 'short' })} {d.getDate()}
            </span>
            <span className={styles.weekDayShort}>
              {shortDay} {d.getDate()}
            </span>
          </div>
        );
      })}
      {hours.map((hour) => (
        <React.Fragment key={hour}>
          <div className={styles.weekTimeCell}>
            {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
          </div>
          {days.map((d) => {
            const dateKey = formatDateKeyLocal(d);
            const dayEvents = events.filter((e) => {
              const start = new Date(e.startAt);
              return formatDateKeyLocal(start) === dateKey && !e.allDay && start.getHours() === hour;
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

function MonthViewMobile({
  cursor,
  byDay,
  todayKey,
}: {
  cursor: Date;
  byDay: Map<string, CalendarEvent[]>;
  todayKey: string;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return d;
  });

  return (
    <ul className={styles.mobileMonthList}>
      {days.map((d) => {
        const dateKey = formatDateKeyLocal(d);
        const dayEvents = byDay.get(dateKey) ?? [];
        const isToday = dateKey === todayKey;
        return (
          <li key={dateKey} className={styles.mobileDayCard} data-today={isToday || undefined}>
            <div className={styles.mobileDayHeader}>
              {d.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className={styles.mobileDayEvents}>
              {dayEvents.length === 0 ? (
                <span className={styles.mobileDayEmpty}>No events</span>
              ) : (
                dayEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/calendar/events/${e.id}`}
                    className={styles.mobileEventCard}
                  >
                    <span className={styles.mobileEventTime}>
                      {e.allDay
                        ? 'All day'
                        : new Date(e.startAt).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                    </span>
                    <span className={styles.mobileEventTitle}>{e.title}</span>
                  </Link>
                ))
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function WeekViewMobile({
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
  const byDay = groupEventsByDay(events);

  return (
    <ul className={styles.mobileWeekList}>
      {days.map((d) => {
        const dateKey = formatDateKeyLocal(d);
        const dayEvents = (byDay.get(dateKey) ?? []).sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );
        const isToday = dateKey === todayKey;
        return (
          <li key={dateKey} className={styles.mobileDayCard} data-today={isToday || undefined}>
            <div className={styles.mobileDayHeader}>
              {d.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className={styles.mobileDayEvents}>
              {dayEvents.length === 0 ? (
                <span className={styles.mobileDayEmpty}>No events</span>
              ) : (
                dayEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/calendar/events/${e.id}`}
                    className={styles.mobileEventCard}
                  >
                    <span className={styles.mobileEventTime}>
                      {e.allDay
                        ? 'All day'
                        : `${new Date(e.startAt).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })} – ${new Date(e.endAt).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}`}
                    </span>
                    <span className={styles.mobileEventTitle}>{e.title}</span>
                  </Link>
                ))
              )}
            </div>
          </li>
        );
      })}
    </ul>
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
