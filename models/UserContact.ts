import mongoose, { Schema, model, models } from 'mongoose';

export type UserContactState = 'default' | 'friend' | 'favoriteFriend';

export interface IUserContact {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  contactUserId: mongoose.Types.ObjectId;
  state: UserContactState;
  createdAt?: Date;
  updatedAt?: Date;
}

const userContactSchema = new Schema<IUserContact>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contactUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    state: {
      type: String,
      enum: ['default', 'friend', 'favoriteFriend'],
      default: 'default',
    },
  },
  { timestamps: true, collection: 'user_contacts' }
);

userContactSchema.index({ ownerId: 1, contactUserId: 1 }, { unique: true });
userContactSchema.index({ ownerId: 1, state: 1 });
userContactSchema.index({ contactUserId: 1 });

const UserContactModel =
  models?.UserContact ?? model<IUserContact>('UserContact', userContactSchema);
export default UserContactModel;
