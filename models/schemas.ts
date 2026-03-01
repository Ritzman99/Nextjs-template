import { Schema } from 'mongoose';

export type RefType = 'user' | 'contact';

export interface IRef {
  type: RefType;
  ref: import('mongoose').Types.ObjectId;
}

/**
 * Shared schema for participant refs: { type: 'user' | 'contact', ref: ObjectId }.
 * Used by InboxMessage (toRefs, ccRefs, bccRefs), Event (organizer, attendees), etc.
 */
export const refSchema = new Schema<IRef>(
  {
    type: { type: String, enum: ['user', 'contact'], required: true },
    ref: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);
