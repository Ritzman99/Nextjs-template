'use client';

import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addDays } from 'date-fns';
import type { HTMLAttributes } from 'react';
import styles from './Calendar.module.scss';

export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: Date;
  onChange?: (date: Date) => void;
  min?: Date;
  max?: Date;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar({
  value,
  onChange,
  min,
  max,
  className = '',
  ...rest
}: CalendarProps) {
  const [view, setView] = useState(value ? startOfMonth(value) : startOfMonth(new Date()));

  const monthStart = startOfMonth(view);
  const monthEnd = endOfMonth(view);
  const start = startOfWeek(monthStart);
  const end = endOfWeek(monthEnd);

  const rows: Date[][] = [];
  let days: Date[] = [];
  let day = start;

  while (day <= end) {
    days.push(day);
    if (days.length === 7) {
      rows.push(days);
      days = [];
    }
    day = addDays(day, 1);
  }
  if (days.length) rows.push(days);

  const selected = value ?? null;
  const isDisabled = (d: Date) => {
    if (min != null && d < min) return true;
    if (max != null && d > max) return true;
    return false;
  };

  return (
    <div className={`${styles.root} ${className}`.trim()} {...rest}>
      <div className={styles.header}>
        <span className={styles.monthYear}>{format(view, 'MMMM yyyy')}</span>
        <div className={styles.nav}>
          <button type="button" className={styles.navButton} onClick={() => setView(subMonths(view, 1))} aria-label="Previous month">
            ‹
          </button>
          <button type="button" className={styles.navButton} onClick={() => setView(addMonths(view, 1))} aria-label="Next month">
            ›
          </button>
        </div>
      </div>
      <div className={styles.grid}>
        {WEEKDAYS.map((wd) => (
          <div key={wd} className={styles.weekday}>
            {wd}
          </div>
        ))}
        {rows.flat().map((d, i) => {
          const sameMonth = isSameMonth(d, view);
          const selectedDay = selected != null && isSameDay(d, selected);
          const today = isToday(d);
          const disabled = isDisabled(d);
          return (
            <button
              key={i}
              type="button"
              className={`${styles.day} ${!sameMonth ? styles.outside : ''} ${selectedDay ? styles.selected : ''} ${today ? styles.today : ''}`}
              onClick={() => !disabled && sameMonth && onChange?.(d)}
              disabled={disabled}
            >
              {format(d, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
