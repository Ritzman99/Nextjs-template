import mongoose, { Schema, model, models } from 'mongoose';

export interface IEventExceptionOverride {
  title?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
  cancelled?: boolean | null;
  locationText?: string | null;
  description?: string | null;
}

export interface IEventException {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  /** Original instance start date (date part only for all-day; full datetime for timed). */
  instanceStartAt: Date;
  override: IEventExceptionOverride;
  createdAt?: Date;
  updatedAt?: Date;
}

const overrideSchema = new Schema<IEventExceptionOverride>(
  {
    title: { type: String, default: null },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    cancelled: { type: Boolean, default: null },
    locationText: { type: String, default: null },
    description: { type: String, default: null },
  },
  { _id: false }
);

const eventExceptionSchema = new Schema<IEventException>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    instanceStartAt: { type: Date, required: true },
    override: { type: overrideSchema, default: () => ({}) },
  },
  { timestamps: true, collection: 'event_exceptions' }
);

eventExceptionSchema.index({ eventId: 1, instanceStartAt: 1 }, { unique: true });

const EventExceptionModel =
  models?.EventException ??
  model<IEventException>('EventException', eventExceptionSchema);
export default EventExceptionModel;
