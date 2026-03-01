import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import EventModel from '@/models/Event';
import EventExceptionModel from '@/models/EventException';

const BY_DAY_TO_JS: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

export interface EventInstance {
  eventId: mongoose.Types.ObjectId;
  startAt: Date;
  endAt: Date;
  title: string;
  description?: string | null;
  locationText?: string | null;
  allDay: boolean;
  status: 'scheduled' | 'cancelled';
  isException?: boolean;
}

/**
 * Expand recurring events to instances in [rangeStart, rangeEnd], applying exceptions.
 * Returns flat list of event instances (single events as one instance; recurring as many).
 */
export async function getEventsInRange(
  calendarIds: mongoose.Types.ObjectId[],
  rangeStart: Date,
  rangeEnd: Date
): Promise<EventInstance[]> {
  await connect();

  const events = await EventModel.find({
    calendarId: { $in: calendarIds },
    status: 'scheduled',
    startAt: { $lte: rangeEnd },
    $or: [
      { recurrence: { $exists: false } },
      { recurrence: null },
      { 'recurrence.until': { $gte: rangeStart } },
      { 'recurrence.until': null },
    ],
  }).lean();

  const exceptions = await EventExceptionModel.find({
    eventId: { $in: events.map((e) => (e as { _id: mongoose.Types.ObjectId })._id) },
    'override.cancelled': { $ne: true },
  }).lean();

  const exceptionByKey = new Map<string, { instanceStartAt: Date; override: Record<string, unknown> }>();
  for (const ex of exceptions) {
    const e = ex as unknown as { eventId: mongoose.Types.ObjectId; instanceStartAt: Date; override: Record<string, unknown> };
    const d = new Date(e.instanceStartAt);
    d.setHours(0, 0, 0, 0);
    const key = `${e.eventId.toString()}-${d.getTime()}`;
    exceptionByKey.set(key, { instanceStartAt: e.instanceStartAt, override: e.override ?? {} });
  }

  const cancelledInstances = await EventExceptionModel.find({
    eventId: { $in: events.map((e) => (e as { _id: mongoose.Types.ObjectId })._id) },
    'override.cancelled': true,
  })
    .select('eventId instanceStartAt')
    .lean();
  const cancelledSet = new Set(
    cancelledInstances.map(
      (c) => `${(c as unknown as { eventId: mongoose.Types.ObjectId }).eventId.toString()}-${new Date((c as unknown as { instanceStartAt: Date }).instanceStartAt).setHours(0, 0, 0, 0)}`
    )
  );

  const result: EventInstance[] = [];

  for (const ev of events) {
    const e = ev as unknown as {
      _id: mongoose.Types.ObjectId;
      title: string;
      description?: string | null;
      locationText?: string | null;
      startAt: Date;
      endAt: Date;
      allDay: boolean;
      status: string;
      recurrence?: {
        freq: string;
        interval: number;
        byDay?: string[];
        byMonthDay?: number[];
        until?: Date;
        count?: number;
        exDates?: Date[];
      } | null;
    };

    const baseStart = new Date(e.startAt);
    const baseEnd = new Date(e.endAt);
    const durationMs = baseEnd.getTime() - baseStart.getTime();
    const rec = e.recurrence;

    if (!rec || !rec.freq) {
      if (baseStart.getTime() >= rangeStart.getTime() && baseStart.getTime() < rangeEnd.getTime()) {
        const excKey = `${e._id.toString()}-${new Date(baseStart).setHours(0, 0, 0, 0)}`;
        if (cancelledSet.has(excKey)) continue;
        const ex = exceptionByKey.get(`${e._id.toString()}-${baseStart.getTime()}`);
        const override = ex?.override ?? {};
        result.push({
          eventId: e._id,
          startAt: (override.startAt as Date) ?? baseStart,
          endAt: (override.endAt as Date) ?? baseEnd,
          title: (override.title as string) ?? e.title,
          description: (override.description as string | null) ?? e.description ?? null,
          locationText: (override.locationText as string | null) ?? e.locationText ?? null,
          allDay: e.allDay,
          status: (override.cancelled ? 'cancelled' : e.status) as 'scheduled' | 'cancelled',
          isException: !!ex,
        });
      }
      continue;
    }

    const interval = Math.max(1, rec.interval ?? 1);
    const until = rec.until ? new Date(rec.until) : null;
    const exDatesSet = new Set(
      (rec.exDates ?? []).map((d) => new Date(d).setHours(0, 0, 0, 0))
    );

    const instanceDates = expandRecurrence(baseStart, rangeStart, rangeEnd, {
      freq: rec.freq,
      interval,
      byDay: rec.byDay,
      byMonthDay: rec.byMonthDay,
      until,
      count: rec.count,
      exDatesSet,
    });

    for (const instDate of instanceDates) {
      const excKey = `${e._id.toString()}-${new Date(instDate).setHours(0, 0, 0, 0)}`;
      if (cancelledSet.has(excKey)) continue;

      const instStart = new Date(instDate);
      instStart.setHours(baseStart.getHours(), baseStart.getMinutes(), baseStart.getSeconds(), 0);
      const instEnd = new Date(instStart.getTime() + durationMs);

      const instDateKey = new Date(instStart);
      instDateKey.setHours(0, 0, 0, 0);
      const ex = exceptionByKey.get(`${e._id.toString()}-${instDateKey.getTime()}`);
      const override = ex?.override ?? {};
      result.push({
        eventId: e._id,
        startAt: (override.startAt as Date) ?? instStart,
        endAt: (override.endAt as Date) ?? instEnd,
        title: (override.title as string) ?? e.title,
        description: (override.description as string | null) ?? e.description ?? null,
        locationText: (override.locationText as string | null) ?? e.locationText ?? null,
        allDay: e.allDay,
        status: e.status as 'scheduled' | 'cancelled',
        isException: !!ex,
      });
    }
  }

  result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return result;
}

function expandRecurrence(
  baseStart: Date,
  rangeStart: Date,
  rangeEnd: Date,
  opts: {
    freq: string;
    interval: number;
    byDay?: string[];
    byMonthDay?: number[];
    until: Date | null;
    count?: number;
    exDatesSet: Set<number>;
  }
): Date[] {
  const out: Date[] = [];
  const cur = new Date(baseStart);
  cur.setHours(0, 0, 0, 0);
  const rangeStartT = rangeStart.getTime();
  const rangeEndT = rangeEnd.getTime();
  const byDayNums = opts.byDay?.map((d) => BY_DAY_TO_JS[d] ?? 0).filter((_, i, a) => a.indexOf(a[i]) === i);
  let n = 0;
  const maxCount = opts.count ?? 9999;

  while (cur.getTime() <= rangeEndT && n < maxCount) {
    if (opts.until && cur.getTime() > opts.until.getTime()) break;

    const curDateKey = cur.getTime();
    if (opts.exDatesSet.has(curDateKey)) {
      advance(cur, opts.freq, opts.interval, byDayNums);
      continue;
    }

    if (cur.getTime() >= rangeStartT) {
      const dayOfWeek = cur.getDay();
      const dayOfMonth = cur.getDate();
      let include = true;
      if (byDayNums && byDayNums.length > 0) include = byDayNums.includes(dayOfWeek);
      if (include && opts.byMonthDay && opts.byMonthDay.length > 0) include = opts.byMonthDay.includes(dayOfMonth);
      if (include) {
        out.push(new Date(cur.getTime()));
        n++;
      }
    }

    advance(cur, opts.freq, opts.interval, byDayNums);
  }

  return out;
}

function advance(
  cur: Date,
  freq: string,
  interval: number,
  byDayNums: number[] | undefined
): void {
  if (freq === 'daily') {
    cur.setDate(cur.getDate() + interval);
  } else if (freq === 'weekly') {
    cur.setDate(cur.getDate() + (byDayNums?.length ? 1 : 7 * interval));
  } else if (freq === 'monthly') {
    cur.setMonth(cur.getMonth() + interval);
  } else if (freq === 'yearly') {
    cur.setFullYear(cur.getFullYear() + interval);
  } else {
    cur.setDate(cur.getDate() + 1);
  }
}
