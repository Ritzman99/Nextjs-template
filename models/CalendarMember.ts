import mongoose, { Schema, model, models } from 'mongoose';

export type CalendarMemberRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ICalendarMember {
  _id: mongoose.Types.ObjectId;
  calendarId: mongoose.Types.ObjectId;
  memberType: 'user';
  memberRef: mongoose.Types.ObjectId;
  role: CalendarMemberRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const calendarMemberSchema = new Schema<ICalendarMember>(
  {
    calendarId: { type: Schema.Types.ObjectId, ref: 'Calendar', required: true },
    memberType: { type: String, enum: ['user'], required: true },
    memberRef: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      required: true,
    },
  },
  { timestamps: true, collection: 'calendar_members' }
);

calendarMemberSchema.index({ calendarId: 1, memberRef: 1 }, { unique: true });
calendarMemberSchema.index({ memberRef: 1, role: 1 });

const CalendarMemberModel =
  models?.CalendarMember ??
  model<ICalendarMember>('CalendarMember', calendarMemberSchema);
export default CalendarMemberModel;
