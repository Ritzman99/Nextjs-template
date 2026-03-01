import mongoose, { Schema, model, models } from 'mongoose';

export type RsvpStatus = 'needs_action' | 'yes' | 'no' | 'maybe';
export type ReminderChannel = 'inbox' | 'email' | 'push';

export interface IReminder {
  minutesBefore: number;
  channel: ReminderChannel;
  enabled: boolean;
}

export interface IUserEventState {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  rsvp: RsvpStatus;
  responseAt?: Date | null;
  readAt?: Date | null;
  hidden: boolean;
  colorOverride?: string | null;
  reminders: IReminder[];
  /** Denormalized from Event for fast agenda / invites queries */
  eventStartAt?: Date | null;
  eventEndAt?: Date | null;
  eventTitle?: string | null;
  eventStatus?: 'scheduled' | 'cancelled' | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const reminderSchema = new Schema<IReminder>(
  {
    minutesBefore: { type: Number, required: true },
    channel: { type: String, enum: ['inbox', 'email', 'push'], required: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const userEventStateSchema = new Schema<IUserEventState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    rsvp: {
      type: String,
      enum: ['needs_action', 'yes', 'no', 'maybe'],
      default: 'needs_action',
    },
    responseAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    hidden: { type: Boolean, default: false },
    colorOverride: { type: String, default: null },
    reminders: { type: [reminderSchema], default: [] },
    eventStartAt: { type: Date, default: null },
    eventEndAt: { type: Date, default: null },
    eventTitle: { type: String, default: null },
    eventStatus: { type: String, enum: ['scheduled', 'cancelled'], default: null },
  },
  { timestamps: true, collection: 'user_event_states' }
);

userEventStateSchema.index({ userId: 1, eventId: 1 }, { unique: true });
userEventStateSchema.index({ userId: 1, eventStartAt: 1 });
userEventStateSchema.index({ userId: 1, rsvp: 1 });
userEventStateSchema.index({ userId: 1, hidden: 1 });
userEventStateSchema.index({ eventId: 1, rsvp: 1 });

const UserEventStateModel =
  models?.UserEventState ??
  model<IUserEventState>('UserEventState', userEventStateSchema);
export default UserEventStateModel;
