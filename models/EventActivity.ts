import mongoose, { Schema, model, models } from 'mongoose';

export type EventActivityKind =
  | 'created'
  | 'updated'
  | 'cancelled'
  | 'rsvp_changed'
  | 'reminder_sent'
  | 'comment';

export interface IEventActivity {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  actorType: 'user' | 'contact' | 'system';
  actorRef?: mongoose.Types.ObjectId | null;
  kind: EventActivityKind;
  summary?: string | null;
  diff?: Record<string, unknown> | null;
  createdAt: Date;
}

const eventActivitySchema = new Schema<IEventActivity>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    actorType: { type: String, enum: ['user', 'contact', 'system'], required: true },
    actorRef: { type: Schema.Types.ObjectId, default: null },
    kind: {
      type: String,
      enum: ['created', 'updated', 'cancelled', 'rsvp_changed', 'reminder_sent', 'comment'],
      required: true,
    },
    summary: { type: String, default: null },
    diff: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'event_activities' }
);

eventActivitySchema.index({ eventId: 1, createdAt: 1 });

const EventActivityModel =
  models?.EventActivity ??
  model<IEventActivity>('EventActivity', eventActivitySchema);
export default EventActivityModel;
