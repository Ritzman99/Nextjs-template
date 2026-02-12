import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import TicketModel from '@/models/Ticket';
import TicketMessageModel from '@/models/TicketMessage';
import UserModel from '@/models/User';
import { requireAdmin } from '@/lib/adminAuth';
import type { ITicketMessage } from '@/models/TicketMessage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const out = await requireAdmin();
  if (out.error) return out.error;
  const session = out.session as { user?: { id?: string } } | null;
  const authorUserId = session?.user?.id;
  if (!authorUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: ticketId } = await params;
  if (!ticketId || !mongoose.isValidObjectId(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { body: messageBody, isInternal } = body as { body?: string; isInternal?: boolean };
    if (!messageBody || typeof messageBody !== 'string' || !messageBody.trim()) {
      return NextResponse.json({ error: 'body is required' }, { status: 400 });
    }
    await connect();
    const ticket = await TicketModel.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    const profile = await UserModel.findOne({ userId: authorUserId }).lean();
    const authorObjectId = profile ? (profile as { _id: mongoose.Types.ObjectId })._id : null;
    if (!authorObjectId) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 400 });
    }
    const doc = await TicketMessageModel.create({
      ticketId: new mongoose.Types.ObjectId(ticketId),
      authorId: authorObjectId!,
      body: messageBody.trim(),
      isInternal: Boolean(isInternal),
    });
    await TicketModel.findByIdAndUpdate(ticketId, { $set: { updatedAt: new Date() } });
    const m = doc as ITicketMessage & { _id: { toString(): string }; createdAt: Date; updatedAt: Date };
    return NextResponse.json({
      id: m._id.toString(),
      ticketId: m.ticketId.toString(),
      authorId: m.authorId.toString(),
      body: m.body,
      isInternal: m.isInternal ?? false,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    });
  } catch (e) {
    console.error('POST /api/admin/tickets/[id]/messages:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
