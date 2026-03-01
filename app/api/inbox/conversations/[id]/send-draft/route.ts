import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import ConversationModel from '@/models/Conversation';
import InboxMessageModel from '@/models/InboxMessage';
import UserConversationStateModel from '@/models/UserConversationState';

export async function POST(
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
    const { to, subject, body: messageBody, cc, bcc } = body as {
      to?: string[];
      subject?: string;
      body?: string;
      cc?: string[];
      bcc?: string[];
    };

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: 'At least one recipient (to) is required' }, { status: 400 });
    }

    const { resolveRecipient } = await import('@/lib/inboxResolver');
    const toResolved: Array<{ type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }> = [];
    for (const identifier of to) {
      if (!identifier || typeof identifier !== 'string') continue;
      const r = await resolveRecipient(identifier);
      if (!r) {
        return NextResponse.json({ error: `Could not resolve recipient: ${identifier}` }, { status: 400 });
      }
      toResolved.push({ type: r.type, ref: r.id });
    }
    let ccResolved: Array<{ type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }> = [];
    if (cc && Array.isArray(cc)) {
      for (const identifier of cc) {
        if (!identifier || typeof identifier !== 'string') continue;
        const r = await resolveRecipient(identifier);
        if (r) ccResolved.push({ type: r.type, ref: r.id });
      }
    }
    let bccResolved: Array<{ type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }> = [];
    if (bcc && Array.isArray(bcc)) {
      for (const identifier of bcc) {
        if (!identifier || typeof identifier !== 'string') continue;
        const r = await resolveRecipient(identifier);
        if (r) bccResolved.push({ type: r.type, ref: r.id });
      }
    }

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

    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (subject !== undefined) {
      conversation.subject = typeof subject === 'string' ? subject.trim() || null : null;
      await conversation.save();
    }

    let firstMessage = await InboxMessageModel.findOne({ conversationId }).sort({ createdAt: 1 });
    if (!firstMessage) {
      firstMessage = await InboxMessageModel.create({
        conversationId,
        fromType: 'user',
        fromRef: userObjectId,
        toRefs: toResolved,
        ccRefs: ccResolved.length ? ccResolved : undefined,
        bccRefs: bccResolved.length ? bccResolved : undefined,
        body: typeof messageBody === 'string' ? messageBody : '',
      });
    } else {
      firstMessage.toRefs = toResolved;
      firstMessage.ccRefs = ccResolved.length ? ccResolved : undefined;
      firstMessage.bccRefs = bccResolved.length ? bccResolved : undefined;
      if (messageBody !== undefined) {
        firstMessage.body = typeof messageBody === 'string' ? messageBody : firstMessage.body;
      }
      await firstMessage.save();
    }

    await ConversationModel.updateOne(
      { _id: conversationId },
      { $set: { updatedAt: new Date() } }
    );

    const now = new Date();
    await UserConversationStateModel.updateOne(
      { userId: userObjectId, conversationId },
      { $set: { updatedAt: now, folder: 'sent', readAt: now } }
    );
    for (const t of toResolved) {
      if (t.type !== 'user') continue;
      await UserConversationStateModel.findOneAndUpdate(
        { userId: t.ref, conversationId },
        { $set: { folder: 'inbox', readAt: null, updatedAt: now } },
        { upsert: true }
      );
    }
    for (const t of ccResolved) {
      if (t.type !== 'user') continue;
      await UserConversationStateModel.findOneAndUpdate(
        { userId: t.ref, conversationId },
        { $set: { folder: 'inbox', readAt: null, updatedAt: now } },
        { upsert: true }
      );
    }

    return NextResponse.json({
      id: firstMessage._id.toString(),
      conversationId: id,
      body: firstMessage.body,
      createdAt: firstMessage.createdAt,
    });
  } catch (e) {
    console.error('POST /api/inbox/conversations/[id]/send-draft:', e);
    return NextResponse.json({ error: 'Failed to send draft' }, { status: 500 });
  }
}
