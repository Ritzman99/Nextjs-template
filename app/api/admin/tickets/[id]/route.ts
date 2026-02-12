import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import TicketModel from '@/models/Ticket';
import TicketMessageModel from '@/models/TicketMessage';
import UserModel from '@/models/User';
import { requireAdmin } from '@/lib/adminAuth';

async function resolveUserIdToObjectId(id: string | null): Promise<mongoose.Types.ObjectId | null> {
  if (!id || typeof id !== 'string') return null;
  const profile = mongoose.isValidObjectId(id)
    ? await UserModel.findOne({ $or: [{ userId: id }, { _id: new mongoose.Types.ObjectId(id) }] }).select('_id').lean()
    : await UserModel.findOne({ userId: id }).select('_id').lean();
  return profile ? (profile as { _id: mongoose.Types.ObjectId })._id : null;
}
import type { ITicket } from '@/models/Ticket';
import type { ITicketMessage } from '@/models/TicketMessage';

function toSafeTicket(doc: ITicket & { _id: { toString(): string }; createdAt: Date; updatedAt: Date }) {
  return {
    id: doc._id.toString(),
    ticketId: doc.ticketId ?? null,
    subject: doc.subject,
    status: doc.status,
    priority: doc.priority ?? null,
    requesterId: doc.requesterId?.toString() ?? null,
    assigneeId: doc.assigneeId?.toString() ?? null,
    channel: doc.channel,
    emailMessageId: doc.emailMessageId ?? null,
    emailThreadId: doc.emailThreadId ?? null,
    body: doc.body ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toSafeMessage(
  doc: ITicketMessage & { _id: { toString(): string }; createdAt: Date; updatedAt: Date }
) {
  return {
    id: doc._id.toString(),
    ticketId: doc.ticketId.toString(),
    authorId: doc.authorId.toString(),
    body: doc.body,
    isInternal: doc.isInternal ?? false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  try {
    await connect();
    const ticket = await TicketModel.findById(id).lean() as (ITicket & { _id: { toString(): string }; createdAt: Date; updatedAt: Date }) | null;
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    const messages = (await TicketMessageModel.find({ ticketId: new mongoose.Types.ObjectId(id) })
      .lean()
      .sort({ createdAt: 1 })) as unknown as (ITicketMessage & { _id: { toString(): string }; createdAt: Date; updatedAt: Date })[];
    const requesterDoc = await UserModel.findById(ticket.requesterId).lean().select('userId email name');
    const assigneeDoc = ticket.assigneeId
      ? await UserModel.findById(ticket.assigneeId).lean().select('userId email name')
      : null;
    const requester = requesterDoc
      ? { id: (requesterDoc as { userId?: string }).userId ?? (requesterDoc as { _id: { toString(): string } })._id.toString(), email: (requesterDoc as { email?: string }).email ?? '', name: (requesterDoc as { name?: string }).name }
      : null;
    const assignee = assigneeDoc
      ? { id: (assigneeDoc as { userId?: string }).userId ?? (assigneeDoc as { _id: { toString(): string } })._id.toString(), email: (assigneeDoc as { email?: string }).email ?? '', name: (assigneeDoc as { name?: string }).name }
      : null;
    return NextResponse.json({
      ticket: toSafeTicket(ticket),
      messages: messages.map(toSafeMessage),
      requester,
      assignee,
    });
  } catch (e) {
    console.error('GET /api/admin/tickets/[id]:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { subject, status, priority, assigneeId, body: ticketBody } = body as {
      subject?: string;
      status?: string;
      priority?: string;
      assigneeId?: string | null;
      body?: string | null;
    };
    const update: Record<string, unknown> = {};
    if (typeof subject === 'string' && subject.trim()) update.subject = subject.trim();
    if (['open', 'pending', 'resolved', 'closed'].includes(status ?? '')) update.status = status;
    if (['low', 'medium', 'high', 'urgent'].includes(priority ?? '')) update.priority = priority;
    if (assigneeId !== undefined) {
      update.assigneeId = await resolveUserIdToObjectId(assigneeId);
    }
    if (ticketBody !== undefined) update.body = typeof ticketBody === 'string' ? ticketBody : null;
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    await connect();
    const ticket = await TicketModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    const t = ticket as unknown as ITicket & { _id: { toString(): string }; createdAt: Date; updatedAt: Date };
    return NextResponse.json(toSafeTicket(t));
  } catch (e) {
    console.error('PATCH /api/admin/tickets/[id]:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
