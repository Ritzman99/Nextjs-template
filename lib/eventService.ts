import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import ConversationModel from '@/models/Conversation';
import InboxMessageModel from '@/models/InboxMessage';
import UserConversationStateModel, { type InboxFolder } from '@/models/UserConversationState';
import EventModel, { type IEvent } from '@/models/Event';
import UserEventStateModel from '@/models/UserEventState';
import EventActivityModel from '@/models/EventActivity';
import type { IRef } from '@/models/schemas';

const EVENT_INVITE_LABEL = 'event:invite';

function eventInviteLabel(eventId: mongoose.Types.ObjectId): string {
  return `event:${eventId.toString()}`;
}

function formatInviteBody(event: {
  title: string;
  startAt: Date;
  endAt: Date;
  allDay?: boolean;
  locationText?: string | null;
}): string {
  const start = event.allDay
    ? event.startAt.toLocaleDateString()
    : event.startAt.toLocaleString();
  const end = event.allDay
    ? event.endAt.toLocaleDateString()
    : event.endAt.toLocaleString();
  const location = event.locationText ? `\nLocation: ${event.locationText}` : '';
  return `You're invited to: ${event.title}\n\nWhen: ${start} – ${end}${location}\n\nReply with your RSVP (Yes / No / Maybe) in this thread.`;
}

export interface CreateEventParams {
  calendarId: mongoose.Types.ObjectId;
  organizerType: 'user' | 'contact';
  organizerRef: mongoose.Types.ObjectId;
  title: string;
  description?: string | null;
  locationText?: string | null;
  startAt: Date;
  endAt: Date;
  allDay?: boolean;
  timezone?: string | null;
  attendees: IRef[];
  createConversationThread?: boolean;
}

export interface CreateEventResult {
  event: IEvent;
  conversationId: mongoose.Types.ObjectId | null;
  messageId: mongoose.Types.ObjectId | null;
}

/**
 * Create an event and optionally a conversation thread with initial invite message,
 * UserConversationState for organizer and user attendees, and UserEventState for user attendees.
 */
export async function createEvent(params: CreateEventParams): Promise<CreateEventResult> {
  await connect();

  const {
    calendarId,
    organizerType,
    organizerRef,
    title,
    description,
    locationText,
    startAt,
    endAt,
    allDay = false,
    timezone,
    attendees,
    createConversationThread = true,
  } = params;

  const event = await EventModel.create({
    calendarId,
    organizerType,
    organizerRef,
    title: title.trim(),
    description: description?.trim() || null,
    locationText: locationText?.trim() || null,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    allDay,
    timezone: timezone ?? null,
    attendees: attendees.length ? attendees : [],
    status: 'scheduled',
    visibility: 'default',
    conversationId: null,
    linkedMessageId: null,
  });

  let conversationId: mongoose.Types.ObjectId | null = null;
  let messageId: mongoose.Types.ObjectId | null = null;

  if (createConversationThread && attendees.length > 0) {
    const conversation = await ConversationModel.create({
      type: 'event',
      subject: `Event: ${event.title}`,
    });
    conversationId = conversation._id;

    const body = formatInviteBody({
      title: event.title,
      startAt: event.startAt,
      endAt: event.endAt,
      allDay: event.allDay,
      locationText: event.locationText,
    });

    const message = await InboxMessageModel.create({
      conversationId: conversation._id,
      fromType: organizerType,
      fromRef: organizerRef,
      toRefs: attendees,
      body,
    });
    messageId = message._id;

    await EventModel.updateOne(
      { _id: event._id },
      { $set: { conversationId: conversation._id, linkedMessageId: message._id } }
    );

    const now = new Date();
    const eventIdStr = event._id.toString();
    const inviteLabels = [EVENT_INVITE_LABEL, eventInviteLabel(event._id)];

    const statesToCreate: Array<{
      userId: mongoose.Types.ObjectId;
      conversationId: mongoose.Types.ObjectId;
      folder: InboxFolder;
      readAt: Date | null;
      starred: boolean;
      labels: string[];
    }> = [];

    if (organizerType === 'user') {
      statesToCreate.push({
        userId: organizerRef,
        conversationId: conversation._id,
        folder: 'sent',
        readAt: now,
        starred: false,
        labels: [],
      });
    }

    for (const a of attendees) {
      if (a.type !== 'user') continue;
      if (statesToCreate.some((s) => s.userId.equals(a.ref))) continue;
      statesToCreate.push({
        userId: a.ref,
        conversationId: conversation._id,
        folder: 'event_invites',
        readAt: null,
        starred: false,
        labels: inviteLabels,
      });
    }

    if (statesToCreate.length > 0) {
      await UserConversationStateModel.insertMany(statesToCreate);
    }
  }

  const userAttendees = attendees.filter((a) => a.type === 'user');
  if (userAttendees.length > 0) {
    const updatedEvent = await EventModel.findById(event._id).lean();
    const ev = updatedEvent ?? event;
    const states = userAttendees.map((a) => ({
      userId: a.ref,
      eventId: event._id,
      rsvp: 'needs_action' as const,
      eventStartAt: ev.startAt,
      eventEndAt: ev.endAt,
      eventTitle: ev.title,
      eventStatus: ev.status,
    }));
    await UserEventStateModel.insertMany(states);
  }

  const savedEvent = await EventModel.findById(event._id).lean();
  return {
    event: savedEvent as unknown as IEvent,
    conversationId,
    messageId,
  };
}

/**
 * Sync denormalized event fields to all UserEventState documents for this event.
 */
export async function syncUserEventStateDenormalized(
  eventId: mongoose.Types.ObjectId,
  event: { startAt: Date; endAt: Date; title: string; status: 'scheduled' | 'cancelled' }
): Promise<void> {
  await UserEventStateModel.updateMany(
    { eventId },
    {
      $set: {
        eventStartAt: event.startAt,
        eventEndAt: event.endAt,
        eventTitle: event.title,
        eventStatus: event.status,
      },
    }
  );
}

export interface UpdateEventParams {
  title?: string;
  description?: string | null;
  locationText?: string | null;
  startAt?: Date;
  endAt?: Date;
  allDay?: boolean;
  timezone?: string | null;
  attendees?: IRef[];
}

/**
 * Update an event; write EventActivity, post InboxMessage to conversation, clear readAt and sync UserEventState.
 */
export async function updateEvent(
  eventId: mongoose.Types.ObjectId,
  params: UpdateEventParams,
  actor: { type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }
): Promise<IEvent | null> {
  await connect();

  const event = (await EventModel.findById(eventId).lean()) as unknown as IEvent | null;
  if (!event || event.status === 'cancelled') return null;

  const prev: Record<string, unknown> = {
    title: event.title,
    description: event.description,
    locationText: event.locationText,
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: event.allDay,
    timezone: event.timezone,
    attendees: event.attendees,
  };

  const updates: Record<string, unknown> = {};
  if (params.title !== undefined) updates.title = params.title.trim();
  if (params.description !== undefined) updates.description = params.description?.trim() ?? null;
  if (params.locationText !== undefined) updates.locationText = params.locationText?.trim() ?? null;
  if (params.startAt !== undefined) updates.startAt = new Date(params.startAt);
  if (params.endAt !== undefined) updates.endAt = new Date(params.endAt);
  if (params.allDay !== undefined) updates.allDay = params.allDay;
  if (params.timezone !== undefined) updates.timezone = params.timezone ?? null;
  if (params.attendees !== undefined) updates.attendees = params.attendees ?? [];

  const updated = (await EventModel.findByIdAndUpdate(
    eventId,
    { $set: updates },
    { new: true }
  ).lean()) as unknown as IEvent | null;
  if (!updated) return null;

  await EventActivityModel.create({
    eventId,
    actorType: actor.type,
    actorRef: actor.ref,
    kind: 'updated',
    summary: 'Event updated',
    diff: { prev, next: { ...prev, ...updates } },
  });

  if (event.conversationId) {
    const summaryParts: string[] = [];
    if (params.title !== undefined && params.title !== event.title) summaryParts.push(`Title: ${params.title}`);
    if (params.startAt !== undefined) summaryParts.push(`Start: ${new Date(params.startAt).toLocaleString()}`);
    if (params.endAt !== undefined) summaryParts.push(`End: ${new Date(params.endAt).toLocaleString()}`);
    if (params.locationText !== undefined) summaryParts.push(`Location: ${params.locationText || '—'}`);
    const body = summaryParts.length
      ? `Event updated.\n${summaryParts.join('\n')}`
      : 'Event details were updated.';

    await InboxMessageModel.create({
      conversationId: event.conversationId,
      fromType: actor.type,
      fromRef: actor.ref,
      toRefs: event.attendees,
      body,
    });

    await UserEventStateModel.updateMany(
      { eventId },
      { $set: { readAt: null } }
    );
  }

  await syncUserEventStateDenormalized(eventId, {
    startAt: updated.startAt,
    endAt: updated.endAt,
    title: updated.title,
    status: updated.status,
  });

  return updated;
}

/**
 * Cancel an event; set status, post InboxMessage, sync UserEventState.
 */
export async function cancelEvent(
  eventId: mongoose.Types.ObjectId,
  actor: { type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }
): Promise<IEvent | null> {
  await connect();

  const event = (await EventModel.findByIdAndUpdate(
    eventId,
    { $set: { status: 'cancelled' } },
    { new: true }
  ).lean()) as unknown as IEvent | null;
  if (!event) return null;

  await EventActivityModel.create({
    eventId,
    actorType: actor.type,
    actorRef: actor.ref,
    kind: 'cancelled',
    summary: 'Event cancelled',
  });

  if (event.conversationId) {
    await InboxMessageModel.create({
      conversationId: event.conversationId,
      fromType: actor.type,
      fromRef: actor.ref,
      toRefs: event.attendees,
      body: `Event "${event.title}" has been cancelled.`,
    });
  }

  await syncUserEventStateDenormalized(eventId, {
    startAt: event.startAt,
    endAt: event.endAt,
    title: event.title,
    status: 'cancelled',
  });

  return event;
}

export type RsvpValue = 'yes' | 'no' | 'maybe';

/**
 * Record RSVP for the current user; update UserEventState, post InboxMessage, write EventActivity.
 */
export async function setEventRsvp(
  eventId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  rsvp: RsvpValue,
  attendeeDisplayName: string
): Promise<{ success: boolean; error?: string }> {
  await connect();

  const state = await UserEventStateModel.findOne({ eventId, userId }).lean();
  if (!state) {
    return { success: false, error: 'Not an attendee of this event' };
  }

  const event = (await EventModel.findById(eventId).lean()) as unknown as IEvent | null;
  if (!event || event.status === 'cancelled') {
    return { success: false, error: 'Event not found or cancelled' };
  }

  const now = new Date();
  await UserEventStateModel.updateOne(
    { eventId, userId },
    { $set: { rsvp, responseAt: now } }
  );

  await EventActivityModel.create({
    eventId,
    actorType: 'user',
    actorRef: userId,
    kind: 'rsvp_changed',
    summary: `${attendeeDisplayName} responded ${rsvp}`,
  });

  if (event.conversationId) {
    const body = `${attendeeDisplayName} ${rsvp === 'yes' ? 'accepted' : rsvp === 'no' ? 'declined' : 'tentatively accepted'}.`;
    await InboxMessageModel.create({
      conversationId: event.conversationId,
      fromType: 'user',
      fromRef: userId,
      toRefs: [{ type: event.organizerType, ref: event.organizerRef }],
      body,
    });
  }

  return { success: true };
}
