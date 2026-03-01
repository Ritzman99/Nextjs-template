import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import ConversationModel from '@/models/Conversation';
import InboxMessageModel from '@/models/InboxMessage';
import UserConversationStateModel from '@/models/UserConversationState';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
  }
  try {
    const userObjectId = await getCurrentUserObjectId(session.user.id, (session.user as { email?: string | null }).email);
    if (!userObjectId) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const body = await request.json();
    const { subject, body: messageBody, to, cc, bcc } = body as {
      subject?: string;
      body?: string;
      to?: string[];
      cc?: string[];
      bcc?: string[];
    };

    const conversationId = new mongoose.Types.ObjectId(id);
    await connect();

    const state = await UserConversationStateModel.findOne({
      userId: userObjectId,
      conversationId,
    }).lean();
    if (!state) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }
    if ((state as unknown as { folder: string }).folder !== 'draft') {
      return NextResponse.json({ error: 'Conversation is not a draft' }, { status: 400 });
    }

    let toResolved: Array<{ type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }> = [];
    if (to && Array.isArray(to)) {
      const { resolveRecipient } = await import('@/lib/inboxResolver');
      for (const identifier of to) {
        if (!identifier || typeof identifier !== 'string') continue;
        const r = await resolveRecipient(identifier);
        if (r) toResolved.push({ type: r.type, ref: r.id });
      }
    }
    let ccResolved: Array<{ type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }> = [];
    if (cc && Array.isArray(cc)) {
      const { resolveRecipient } = await import('@/lib/inboxResolver');
      for (const identifier of cc) {
        if (!identifier || typeof identifier !== 'string') continue;
        const r = await resolveRecipient(identifier);
        if (r) ccResolved.push({ type: r.type, ref: r.id });
      }
    }
    let bccResolved: Array<{ type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }> = [];
    if (bcc && Array.isArray(bcc)) {
      const { resolveRecipient } = await import('@/lib/inboxResolver');
      for (const identifier of bcc) {
        if (!identifier || typeof identifier !== 'string') continue;
        const r = await resolveRecipient(identifier);
        if (r) bccResolved.push({ type: r.type, ref: r.id });
      }
    }

    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (subject !== undefined) {
      conversation.subject = typeof subject === 'string' ? subject.trim() || null : null;
      await conversation.save();
    }

    const firstMessage = await InboxMessageModel.findOne({ conversationId }).sort({ createdAt: 1 });
    if (!firstMessage) {
      return NextResponse.json({ error: 'Draft has no message' }, { status: 400 });
    }

    firstMessage.toRefs = toResolved;
    firstMessage.ccRefs = ccResolved.length ? ccResolved : undefined;
    firstMessage.bccRefs = bccResolved.length ? bccResolved : undefined;
    if (messageBody !== undefined) {
      firstMessage.body = typeof messageBody === 'string' ? messageBody : '';
    }
    await firstMessage.save();

    const conv = conversation as unknown as { _id: mongoose.Types.ObjectId; subject?: string | null; updatedAt: Date };
    return NextResponse.json({
      id: conv._id.toString(),
      subject: conv.subject ?? null,
      updatedAt: conv.updatedAt,
      messageId: firstMessage._id.toString(),
    });
  } catch (e) {
    console.error('PATCH /api/inbox/conversations/[id]/draft:', e);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}
