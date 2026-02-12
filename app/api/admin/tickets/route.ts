import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import TicketModel from '@/models/Ticket';
import UserModel from '@/models/User';
import { requireAdmin } from '@/lib/adminAuth';
import type { ITicket } from '@/models/Ticket';

function toSafeTicket(doc: ITicket & { _id: { toString(): string } }) {
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

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const status = searchParams.get('status') ?? undefined;
    const assigneeId = searchParams.get('assigneeId') ?? undefined;
    const requesterId = searchParams.get('requesterId') ?? undefined;
    const channel = searchParams.get('channel') ?? undefined;

    await connect();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (assigneeId && mongoose.isValidObjectId(assigneeId)) filter.assigneeId = new mongoose.Types.ObjectId(assigneeId);
    if (requesterId && mongoose.isValidObjectId(requesterId)) filter.requesterId = new mongoose.Types.ObjectId(requesterId);
    if (channel) filter.channel = channel;

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      TicketModel.find(filter).lean().skip(skip).limit(limit).sort({ updatedAt: -1 }),
      TicketModel.countDocuments(filter),
    ]);

    const tickets = (docs as unknown as (ITicket & { _id: { toString(): string }; createdAt: Date; updatedAt: Date })[]).map(toSafeTicket);

    return NextResponse.json({
      tickets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('GET /api/admin/tickets:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = await request.json();
    const {
      subject,
      body: ticketBody,
      status,
      priority,
      requesterId,
      assigneeId,
      channel,
    } = body as {
      subject?: string;
      body?: string;
      status?: string;
      priority?: string;
      requesterId?: string;
      assigneeId?: string | null;
      channel?: string;
    };
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'subject is required' }, { status: 400 });
    }
    if (!requesterId || typeof requesterId !== 'string') {
      return NextResponse.json({ error: 'requesterId is required' }, { status: 400 });
    }
    await connect();
    const requesterProfile = mongoose.isValidObjectId(requesterId)
      ? await UserModel.findOne({ $or: [{ userId: requesterId }, { _id: new mongoose.Types.ObjectId(requesterId) }] }).lean()
      : await UserModel.findOne({ userId: requesterId }).lean();
    const requesterObjectId = requesterProfile ? (requesterProfile as { _id: mongoose.Types.ObjectId })._id : null;
    if (!requesterObjectId) {
      return NextResponse.json({ error: 'Requester user not found' }, { status: 400 });
    }
    const validStatus = ['open', 'pending', 'resolved', 'closed'].includes(status ?? '') ? status : 'open';
    const validPriority = ['low', 'medium', 'high', 'urgent'].includes(priority ?? '') ? priority : 'medium';
    const validChannel = ['email', 'web', 'api'].includes(channel ?? '') ? channel : 'web';

    let assigneeObjectId: mongoose.Types.ObjectId | null = null;
    if (assigneeId && typeof assigneeId === 'string') {
      const assigneeProfile = mongoose.isValidObjectId(assigneeId)
        ? await UserModel.findOne({ $or: [{ userId: assigneeId }, { _id: new mongoose.Types.ObjectId(assigneeId) }] }).select('_id').lean()
        : await UserModel.findOne({ userId: assigneeId }).select('_id').lean();
      assigneeObjectId = assigneeProfile ? (assigneeProfile as { _id: mongoose.Types.ObjectId })._id : null;
    }
    const doc = await TicketModel.create({
      subject: subject.trim(),
      body: typeof ticketBody === 'string' ? ticketBody : null,
      status: validStatus,
      priority: validPriority,
      requesterId: requesterObjectId,
      assigneeId: assigneeObjectId,
      channel: validChannel,
    });
    const d = doc as unknown as ITicket & { _id: { toString(): string }; createdAt: Date; updatedAt: Date };
    return NextResponse.json(toSafeTicket(d));
  } catch (e) {
    console.error('POST /api/admin/tickets:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
