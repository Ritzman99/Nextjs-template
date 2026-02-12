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
  companyId?: mongoose.Types.ObjectId | null;
  locationId?: mongoose.Types.ObjectId | null;
  teamId?: mongoose.Types.ObjectId | null;
  securityRoleId?: mongoose.Types.ObjectId | null;
  roleAssignments?: Array<{
    securityRoleId: mongoose.Types.ObjectId;
    companyId?: mongoose.Types.ObjectId | null;
    locationId?: mongoose.Types.ObjectId | null;
    teamId?: mongoose.Types.ObjectId | null;
    active?: boolean;
    overrides?: Record<string, unknown>;
  }>;

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
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', default: null },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    securityRoleId: { type: Schema.Types.ObjectId, ref: 'SecurityRole', default: null },
    roleAssignments: [
      {
        securityRoleId: { type: Schema.Types.ObjectId, ref: 'SecurityRole', required: true },
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
        locationId: { type: Schema.Types.ObjectId, ref: 'Location', default: null },
        teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
        active: { type: Boolean, default: true },
        overrides: { type: Schema.Types.Mixed },
      },
    ],

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

userSchema.index({ companyId: 1 });
userSchema.index({ locationId: 1 });
userSchema.index({ teamId: 1 });
userSchema.index({ securityRoleId: 1 });
userSchema.index({ 'roleAssignments.securityRoleId': 1 });

const UserModel = models?.User ?? model<IUser>('User', userSchema);
export default UserModel;
