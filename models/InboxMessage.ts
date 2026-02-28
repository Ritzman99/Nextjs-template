import mongoose, { Schema, model, models } from 'mongoose';

export type SenderType = 'user' | 'contact';

export interface IInboxMessage {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  fromType: SenderType;
  fromRef: mongoose.Types.ObjectId;
  toRefs: Array<{ type: SenderType; ref: mongoose.Types.ObjectId }>;
  ccRefs?: Array<{ type: SenderType; ref: mongoose.Types.ObjectId }>;
  bccRefs?: Array<{ type: SenderType; ref: mongoose.Types.ObjectId }>;
  body: string;
  inReplyToId?: mongoose.Types.ObjectId | null;
  linkedConversationId?: mongoose.Types.ObjectId | null;
  linkedMessageId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const refSchema = new Schema(
  { type: { type: String, enum: ['user', 'contact'], required: true }, ref: { type: Schema.Types.ObjectId, required: true } },
  { _id: false }
);

const inboxMessageSchema = new Schema<IInboxMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    fromType: { type: String, enum: ['user', 'contact'], required: true },
    fromRef: { type: Schema.Types.ObjectId, required: true },
    toRefs: { type: [refSchema], default: [] },
    ccRefs: { type: [refSchema], default: undefined },
    bccRefs: { type: [refSchema], default: undefined },
    body: { type: String, required: true },
    inReplyToId: { type: Schema.Types.ObjectId, ref: 'InboxMessage', default: null },
    linkedConversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
    linkedMessageId: { type: Schema.Types.ObjectId, ref: 'InboxMessage', default: null },
  },
  { timestamps: true, collection: 'inbox_messages' }
);

inboxMessageSchema.index({ conversationId: 1, createdAt: 1 });
inboxMessageSchema.index({ fromRef: 1, createdAt: -1 });

const InboxMessageModel =
  models?.InboxMessage ?? model<IInboxMessage>('InboxMessage', inboxMessageSchema);
export default InboxMessageModel;
