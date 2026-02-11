import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  userId: string; // NextAuth adapter user id (string)
  email: string;
  password?: string;
  name?: string;
  image?: string;
  emailVerified?: Date | null;
  role: string;

  firstName?: string;
  lastName?: string;
  gender?: string;
  address?: string;
  age?: number;
  username?: string;
  region?: string;
  state?: string;
  timezone?: string;
  avatar?: string;
  /** S3 object key for avatar (e.g. avatars/userId/uuid.jpg). Use this instead of avatar for uploads. */
  avatarKey?: string;
}

const userSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String },
    image: { type: String },
    emailVerified: { type: Date },
    role: { type: String, default: 'user' },

    firstName: { type: String },
    lastName: { type: String },
    gender: { type: String },
    address: { type: String },
    age: { type: Number },
    username: { type: String, sparse: true },
    region: { type: String },
    state: { type: String },
    timezone: { type: String },
    avatar: { type: String },
    avatarKey: { type: String },
  },
  { timestamps: true, collection: 'user_profiles' }
);

const UserModel = models?.User ?? model<IUser>('User', userSchema);
export default UserModel;
