import mongoose, { Schema, model, models } from 'mongoose';
import type { IRef } from './schemas';

export type EventStatus = 'scheduled' | 'cancelled';
export type EventVisibility = 'default' | 'private';

export interface IEvent {
  _id: mongoose.Types.ObjectId;
  calendarId: mongoose.Types.ObjectId;
  organizerType: 'user' | 'contact';
  organizerRef: mongoose.Types.ObjectId;
  title: string;
  description?: string | null;
  locationText?: string | null;
  locationRef?: mongoose.Types.ObjectId | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  timezone?: string | null;
  attendees: IRef[];
  status: EventStatus;
  visibility: EventVisibility;
  conversationId?: mongoose.Types.ObjectId | null;
  linkedMessageId?: mongoose.Types.ObjectId | null;
  recurrence?: {
    freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    byDay?: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[];
    byMonthDay?: number[];
    until?: Date;
    count?: number;
    exDates?: Date[];
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

import { refSchema } from './schemas';

const eventSchema = new Schema<IEvent>(
  {
    calendarId: { type: Schema.Types.ObjectId, ref: 'Calendar', required: true },
    organizerType: { type: String, enum: ['user', 'contact'], required: true },
    organizerRef: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    locationText: { type: String, default: null },
    locationRef: { type: Schema.Types.ObjectId, ref: 'Location', default: null },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    timezone: { type: String, default: null },
    attendees: { type: [refSchema], default: [] },
    status: { type: String, enum: ['scheduled', 'cancelled'], default: 'scheduled' },
    visibility: { type: String, enum: ['default', 'private'], default: 'default' },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
    linkedMessageId: { type: Schema.Types.ObjectId, ref: 'InboxMessage', default: null },
    recurrence: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: 'events' }
);

eventSchema.index({ calendarId: 1, startAt: 1 });
eventSchema.index({ organizerRef: 1, startAt: 1 });
eventSchema.index({ conversationId: 1 });

const EventModel = models?.Event ?? model<IEvent>('Event', eventSchema);
export default EventModel;
