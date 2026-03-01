import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import EventModel from '@/models/Event';
import CalendarModel from '@/models/Calendar';
import UserEventStateModel from '@/models/UserEventState';
import { updateEvent, cancelEvent } from '@/lib/eventService';
import type { IRef } from '@/models/schemas';

async function canAccessEvent(
  eventId: mongoose.Types.ObjectId,
  userObjectId: mongoose.Types.ObjectId
): Promise<{ event: { _id: mongoose.Types.ObjectId; calendarId: mongoose.Types.ObjectId } | null; canEdit: boolean }> {
  const event = await EventModel.findById(eventId).select('calendarId organizerType organizerRef attendees').lean();
  if (!event) return { event: null, canEdit: false };
  const ev = event as unknown as { calendarId: mongoose.Types.ObjectId; organizerType: string; organizerRef: mongoose.Types.ObjectId; attendees: IRef[] };

  const calendar = await CalendarModel.findOne({
    _id: ev.calendarId,
    ownerId: userObjectId,
  }).lean();
  if (calendar) {
    return {
      event: { _id: (event as { _id: mongoose.Types.ObjectId })._id, calendarId: ev.calendarId },
      canEdit: true,
    };
  }

  const isOrganizer = ev.organizerType === 'user' && ev.organizerRef.equals(userObjectId);
  const isAttendee = ev.attendees.some(
    (a) => a.type === 'user' && a.ref.equals(userObjectId)
  );
  if (isOrganizer || isAttendee) {
    return {
      event: { _id: (event as { _id: mongoose.Types.ObjectId })._id, calendarId: ev.calendarId },
      canEdit: isOrganizer,
    };
  }

  return { event: null, canEdit: false };
}

/**
 * GET: Fetch a single event (if user has access).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  }

  await connect();

  const eventId = new mongoose.Types.ObjectId(id);
  const fullEvent = await EventModel.findById(eventId).lean();
  if (!fullEvent) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const { event: access, canEdit } = await canAccessEvent(eventId, userObjectId);
  if (!access) {
    return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 });
  }

  const e = fullEvent as unknown as {
    _id: mongoose.Types.ObjectId;
    calendarId: mongoose.Types.ObjectId;
    organizerType: string;
    organizerRef: mongoose.Types.ObjectId;
    title: string;
    description?: string | null;
    locationText?: string | null;
    startAt: Date;
    endAt: Date;
    allDay: boolean;
    timezone?: string | null;
    attendees: IRef[];
    status: string;
    visibility: string;
    conversationId?: mongoose.Types.ObjectId | null;
    linkedMessageId?: mongoose.Types.ObjectId | null;
  };

  let myRsvp: string | null = null;
  const state = await UserEventStateModel.findOne({ userId: userObjectId, eventId }).lean();
  if (state) myRsvp = (state as unknown as { rsvp: string }).rsvp;

  return NextResponse.json({
    id: e._id.toString(),
    calendarId: e.calendarId.toString(),
    organizerType: e.organizerType,
    organizerRef: e.organizerRef.toString(),
    title: e.title,
    description: e.description ?? null,
    locationText: e.locationText ?? null,
    startAt: e.startAt,
    endAt: e.endAt,
    allDay: e.allDay,
    timezone: e.timezone ?? null,
    attendees: e.attendees.map((a) => ({ type: a.type, ref: a.ref.toString() })),
    status: e.status,
    visibility: e.visibility,
    conversationId: e.conversationId?.toString() ?? null,
    linkedMessageId: e.linkedMessageId?.toString() ?? null,
    myRsvp,
    canEdit,
  });
}

/**
 * PATCH: Update event (organizer or calendar owner only).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  }

  let body: {
    title?: string;
    description?: string | null;
    locationText?: string | null;
    startAt?: string;
    endAt?: string;
    allDay?: boolean;
    timezone?: string | null;
    attendees?: Array<{ type: 'user' | 'contact'; ref: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  await connect();

  const eventId = new mongoose.Types.ObjectId(id);
  const { event: access, canEdit } = await canAccessEvent(eventId, userObjectId);
  if (!access || !canEdit) {
    return NextResponse.json({ error: 'Event not found or you cannot edit it' }, { status: 404 });
  }

  const updates: Parameters<typeof updateEvent>[1] = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.locationText !== undefined) updates.locationText = body.locationText;
  if (body.startAt !== undefined) updates.startAt = new Date(body.startAt);
  if (body.endAt !== undefined) updates.endAt = new Date(body.endAt);
  if (body.allDay !== undefined) updates.allDay = body.allDay;
  if (body.timezone !== undefined) updates.timezone = body.timezone;
  if (body.attendees !== undefined) {
    updates.attendees = body.attendees
      .filter((a) => a && a.type && a.ref && mongoose.isValidObjectId(a.ref))
      .map((a) => ({ type: a.type as 'user' | 'contact', ref: new mongoose.Types.ObjectId(a.ref) }));
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const updated = await updateEvent(eventId, updates, { type: 'user', ref: userObjectId });
  if (!updated) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }

  return NextResponse.json({
    id: (updated as { _id: mongoose.Types.ObjectId })._id.toString(),
    title: updated.title,
    startAt: updated.startAt,
    endAt: updated.endAt,
  });
}

/**
 * DELETE: Cancel the event (organizer or calendar owner).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  }

  await connect();

  const eventId = new mongoose.Types.ObjectId(id);
  const { canEdit } = await canAccessEvent(eventId, userObjectId);
  if (!canEdit) {
    return NextResponse.json({ error: 'Event not found or you cannot cancel it' }, { status: 404 });
  }

  const cancelled = await cancelEvent(eventId, { type: 'user', ref: userObjectId });
  if (!cancelled) {
    return NextResponse.json({ error: 'Failed to cancel event' }, { status: 500 });
  }

  return NextResponse.json({ cancelled: true, status: 'cancelled' });
}
