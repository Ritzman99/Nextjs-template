import mongoose, { Schema, model, models } from 'mongoose';

export type ContactType = 'system' | 'user';

export interface IContact {
  _id: mongoose.Types.ObjectId;
  type: ContactType;
  identifier: string;
  displayName: string;
  userId?: mongoose.Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const contactSchema = new Schema<IContact>(
  {
    type: { type: String, enum: ['system', 'user'], required: true },
    identifier: { type: String, required: true },
    displayName: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'contacts' }
);

contactSchema.index({ type: 1, identifier: 1 }, { unique: true });

const ContactModel = models?.Contact ?? model<IContact>('Contact', contactSchema);
export default ContactModel;
