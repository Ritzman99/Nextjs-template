import mongoose, { Schema, model, models } from 'mongoose';

export interface ITicketMessage {
  _id: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  body: string;
  isInternal?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ticketMessageSchema = new Schema<ITicketMessage>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    isInternal: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'ticket_messages' }
);

ticketMessageSchema.index({ ticketId: 1, createdAt: 1 });

const TicketMessageModel =
  models?.TicketMessage ?? model<ITicketMessage>('TicketMessage', ticketMessageSchema);
export default TicketMessageModel;
