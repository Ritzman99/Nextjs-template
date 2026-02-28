import mongoose, { Schema, model, models } from 'mongoose';

export type InboxFolder =
  | 'inbox'
  | 'sent'
  | 'draft'
  | 'starred'
  | 'trash'
  | 'spam';

export interface IUserConversationState {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  folder: InboxFolder;
  labels: string[];
  readAt?: Date | null;
  starred: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const userConversationStateSchema = new Schema<IUserConversationState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    folder: {
      type: String,
      enum: ['inbox', 'sent', 'draft', 'starred', 'trash', 'spam'],
      default: 'inbox',
    },
    labels: { type: [String], default: [] },
    readAt: { type: Date, default: null },
    starred: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'user_conversation_states' }
);

userConversationStateSchema.index({ userId: 1, conversationId: 1 }, { unique: true });
userConversationStateSchema.index({ userId: 1, folder: 1 });
userConversationStateSchema.index({ userId: 1, starred: 1 });
userConversationStateSchema.index({ userId: 1, labels: 1 });

const UserConversationStateModel =
  models?.UserConversationState ??
  model<IUserConversationState>('UserConversationState', userConversationStateSchema);
export default UserConversationStateModel;
