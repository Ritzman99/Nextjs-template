import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import { getOrCreateDefaultCalendar } from '@/lib/calendar';
import CalendarModel from '@/models/Calendar';
import { createEvent } from '@/lib/eventService';
import { getEventsInRange } from '@/lib/eventRecurrence';
import { resolveRecipient } from '@/lib/inboxResolver';
import type { IRef } from '@/models/schemas';

/**
 * GET: List events in date range on calendars the user owns (MVP: no shared calendar membership).
 * Query: start (ISO date), end (ISO date).
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userObjectId = await getCurrentUserObjectId(
    session.user.id,
    (session.user as { email?: string | null }).email
  );
  if (!userObjectId) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  if (!startParam || !endParam) {
    return NextResponse.json(
      { error: 'Query params start and end (ISO date) are required' },
      { status: 400 }
    );
  }

  const start = new Date(startParam);
  const end = new Date(endParam);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return NextResponse.json(
      { error: 'Invalid start/end date range' },
      { status: 400 }
    );
  }

  await connect();

  await getOrCreateDefaultCalendar(userObjectId);

  const calendarIds = await CalendarModel.find({ ownerId: userObjectId })
    .select('_id')
    .lean();
  const ids = (calendarIds as { _id: mongoose.Types.ObjectId }[]).map((c) => c._id);
  if (ids.length === 0) {
    return NextResponse.json({ events: [] });
  }

  const instances = await getEventsInRange(ids, start, end);
  const list = instances
    .filter((i) => i.status === 'scheduled')
    .map((i) => ({
      id: i.eventId.toString(),
      title: i.title,
      description: i.description ?? null,
      locationText: i.locationText ?? null,
      startAt: i.startAt,
      endAt: i.endAt,
      allDay: i.allDay,
      status: i.status,
    }));

  return NextResponse.json({ events: list });
}

/**
 * POST: Create an event. Body: calendarId, title, startAt, endAt, [description], [locationText], [allDay], [timezone], [attendees], [createConversationThread].
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userObjectId = await getCurrentUserObjectId(
    session.user.id,
    (session.user as { email?: string | null }).email
  );
  if (!userObjectId) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
  }

  let body: {
    calendarId?: string;
    title?: string;
    startAt?: string;
    endAt?: string;
    description?: string | null;
    locationText?: string | null;
    allDay?: boolean;
    timezone?: string | null;
    attendees?: Array<{ type: 'user' | 'contact'; ref: string }>;
    attendeeIdentifiers?: string[];
    createConversationThread?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { calendarId, title, startAt, endAt, description, locationText, allDay, timezone, attendees: attendeesFromBody = [], attendeeIdentifiers = [], createConversationThread = true } = body;

  if (!calendarId || !mongoose.isValidObjectId(calendarId)) {
    return NextResponse.json({ error: 'Valid calendarId is required' }, { status: 400 });
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (!startAt || !endAt) {
    return NextResponse.json({ error: 'startAt and endAt (ISO date) are required' }, { status: 400 });
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
    return NextResponse.json({ error: 'Invalid startAt/endAt range' }, { status: 400 });
  }

  await connect();

  const calendar = await CalendarModel.findOne({
    _id: new mongoose.Types.ObjectId(calendarId),
    ownerId: userObjectId,
  }).lean();
  if (!calendar) {
    return NextResponse.json({ error: 'Calendar not found or access denied' }, { status: 404 });
  }

  let attendeeRefs: IRef[] = attendeesFromBody
    .filter((a) => a && a.type && a.ref && mongoose.isValidObjectId(a.ref))
    .map((a) => ({ type: a.type as 'user' | 'contact', ref: new mongoose.Types.ObjectId(a.ref) }));

  for (const identifier of attendeeIdentifiers) {
    if (!identifier || typeof identifier !== 'string') continue;
    const resolved = await resolveRecipient(identifier.trim());
    if (resolved && !attendeeRefs.some((a) => a.ref.equals(resolved.id))) {
      attendeeRefs.push({ type: resolved.type, ref: resolved.id });
    }
  }

  const result = await createEvent({
    calendarId: new mongoose.Types.ObjectId(calendarId),
    organizerType: 'user',
    organizerRef: userObjectId,
    title: title.trim(),
    description: description ?? null,
    locationText: locationText ?? null,
    startAt: startDate,
    endAt: endDate,
    allDay: allDay ?? false,
    timezone: timezone ?? null,
    attendees: attendeeRefs,
    createConversationThread,
  });

  return NextResponse.json({
    id: (result.event as { _id: mongoose.Types.ObjectId })._id.toString(),
    conversationId: result.conversationId?.toString() ?? null,
    messageId: result.messageId?.toString() ?? null,
    title: result.event.title,
    startAt: result.event.startAt,
    endAt: result.event.endAt,
  });
}
