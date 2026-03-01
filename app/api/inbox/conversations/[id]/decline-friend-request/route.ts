import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import ConversationModel from '@/models/Conversation';
import InboxMessageModel from '@/models/InboxMessage';
import UserConversationStateModel from '@/models/UserConversationState';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const userObjectId = await getCurrentUserObjectId(
      session.user.id,
      (session.user as { email?: string | null }).email
    );
    if (!userObjectId) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const { id } = await params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
    }
    const conversationId = new mongoose.Types.ObjectId(id);

    await connect();

    const conversation = await ConversationModel.findById(conversationId).lean();
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    const conv = conversation as unknown as { type: string };
    if (conv.type !== 'friend_request') {
      return NextResponse.json(
        { error: 'Not a friend request conversation' },
        { status: 400 }
      );
    }

    const firstMessage = await InboxMessageModel.findOne({ conversationId })
      .sort({ createdAt: 1 })
      .lean();
    if (!firstMessage) {
      return NextResponse.json({ error: 'Conversation has no messages' }, { status: 400 });
    }
    const msg = firstMessage as unknown as {
      toRefs: Array<{ type: string; ref: mongoose.Types.ObjectId }>;
    };
    const isRecipient = msg.toRefs.some(
      (t) => t.type === 'user' && t.ref.equals(userObjectId)
    );
    if (!isRecipient) {
      return NextResponse.json(
        { error: 'Only the recipient can decline this friend request' },
        { status: 403 }
      );
    }

    await UserConversationStateModel.updateOne(
      { userId: userObjectId, conversationId },
      { $set: { folder: 'trash', readAt: new Date() } }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/inbox/conversations/[id]/decline-friend-request:', e);
    return NextResponse.json({ error: 'Failed to decline friend request' }, { status: 500 });
  }
}
