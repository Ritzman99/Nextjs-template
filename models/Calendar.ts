import mongoose, { Schema, model, models } from 'mongoose';

export type CalendarVisibility = 'private' | 'shared' | 'public';

export interface ICalendar {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description?: string | null;
  color?: string | null;
  visibility: CalendarVisibility;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const calendarSchema = new Schema<ICalendar>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    color: { type: String, default: null },
    visibility: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private',
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'calendars' }
);

calendarSchema.index({ ownerId: 1 });
calendarSchema.index({ ownerId: 1, isDefault: 1 });

const CalendarModel =
  models?.Calendar ?? model<ICalendar>('Calendar', calendarSchema);
export default CalendarModel;
