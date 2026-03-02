import mongoose, { Schema, model, models } from 'mongoose';

export interface ICalendarSettings {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  /** IANA timezone (e.g. America/Los_Angeles). Null = use browser/local time. */
  timezone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const calendarSettingsSchema = new Schema<ICalendarSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    timezone: { type: String, default: null },
  },
  { timestamps: true, collection: 'calendar_settings' }
);

const CalendarSettingsModel =
  models?.CalendarSettings ?? model<ICalendarSettings>('CalendarSettings', calendarSettingsSchema);
export default CalendarSettingsModel;
