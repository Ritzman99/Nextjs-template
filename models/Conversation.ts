import mongoose, { Schema, model, models } from 'mongoose';

export type ConversationType = 'email' | 'chat';

export interface IConversation {
  _id: mongoose.Types.ObjectId;
  type: ConversationType;
  subject?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    type: { type: String, enum: ['email', 'chat'], default: 'email' },
    subject: { type: String, default: null },
  },
  { timestamps: true, collection: 'conversations' }
);

conversationSchema.index({ type: 1 });
conversationSchema.index({ updatedAt: -1 });

const ConversationModel =
  models?.Conversation ?? model<IConversation>('Conversation', conversationSchema);
export default ConversationModel;
