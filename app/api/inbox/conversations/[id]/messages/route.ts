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
    const { body: messageBody, inReplyToId } = body as {
      body?: string;
      inReplyToId?: string;
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

    const conversation = await ConversationModel.findById(conversationId).lean();
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const firstMessage = await InboxMessageModel.findOne({ conversationId })
      .sort({ createdAt: 1 })
      .lean();
    if (!firstMessage) {
      return NextResponse.json({ error: 'Conversation has no messages' }, { status: 400 });
    }

    const first = firstMessage as unknown as {
      toRefs: Array<{ type: string; ref: mongoose.Types.ObjectId }>;
      fromRef: mongoose.Types.ObjectId;
      fromType: string;
    };
    const allRecipientRefs = [
      ...first.toRefs.map((t) => ({ type: t.type as 'user' | 'contact', ref: t.ref })),
      { type: first.fromType as 'user' | 'contact', ref: first.fromRef },
    ];
    const uniqueToRefs = Array.from(
      new Map(allRecipientRefs.map((t) => [t.ref.toString(), t])).values()
    ).filter((t) => !t.ref.equals(userObjectId));

    const message = await InboxMessageModel.create({
      conversationId,
      fromType: 'user',
      fromRef: userObjectId,
      toRefs: uniqueToRefs,
      body: typeof messageBody === 'string' ? messageBody : '',
      inReplyToId:
        inReplyToId && mongoose.isValidObjectId(inReplyToId)
          ? new mongoose.Types.ObjectId(inReplyToId)
          : null,
    });

    await ConversationModel.updateOne(
      { _id: conversationId },
      { $set: { updatedAt: new Date() } }
    );

    const now = new Date();
    await UserConversationStateModel.updateOne(
      { userId: userObjectId, conversationId },
      { $set: { updatedAt: now, folder: 'sent' } }
    );
    for (const t of uniqueToRefs) {
      if (t.type !== 'user') continue;
      await UserConversationStateModel.findOneAndUpdate(
        { userId: t.ref, conversationId },
        { $set: { folder: 'inbox', readAt: null, updatedAt: now } },
        { upsert: true }
      );
    }

    return NextResponse.json({
      id: message._id.toString(),
      conversationId: id,
      body: message.body,
      inReplyToId: message.inReplyToId?.toString() ?? null,
      createdAt: message.createdAt,
    });
  } catch (e) {
    console.error('POST /api/inbox/conversations/[id]/messages:', e);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
