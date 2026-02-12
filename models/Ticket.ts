import mongoose, { Schema, model, models } from 'mongoose';

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketChannel = 'email' | 'web' | 'api';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITicket {
  _id: mongoose.Types.ObjectId;
  ticketId?: string;
  subject: string;
  status: TicketStatus;
  priority?: TicketPriority;
  requesterId: mongoose.Types.ObjectId;
  assigneeId?: mongoose.Types.ObjectId | null;
  channel: TicketChannel;
  emailMessageId?: string | null;
  emailThreadId?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    ticketId: { type: String, sparse: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['open', 'pending', 'resolved', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    channel: { type: String, enum: ['email', 'web', 'api'], default: 'web' },
    emailMessageId: { type: String, default: null },
    emailThreadId: { type: String, default: null },
    body: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'tickets' }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ assigneeId: 1 });
ticketSchema.index({ requesterId: 1 });
ticketSchema.index({ channel: 1 });
ticketSchema.index({ updatedAt: -1 });

const TicketModel = models?.Ticket ?? model<ITicket>('Ticket', ticketSchema);
export default TicketModel;
