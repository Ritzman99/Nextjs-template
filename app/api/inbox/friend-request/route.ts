import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import { resolveRecipient } from '@/lib/inboxResolver';
import ConversationModel from '@/models/Conversation';
import InboxMessageModel from '@/models/InboxMessage';
import UserConversationStateModel from '@/models/UserConversationState';
import UserContactModel from '@/models/UserContact';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { identifier } = body as { identifier?: string };
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json({ error: 'identifier is required (email or username)' }, { status: 400 });
    }

    const resolved = await resolveRecipient(identifier.trim());
    if (!resolved) {
      return NextResponse.json(
        { error: 'No user found with that email or username (exact match required)' },
        { status: 400 }
      );
    }
    if (resolved.type !== 'user') {
      return NextResponse.json(
        { error: 'Friend requests can only be sent to users (not system contacts)' },
        { status: 400 }
      );
    }

    const targetUserId = resolved.id;
    if (targetUserId.equals(userObjectId)) {
      return NextResponse.json({ error: 'You cannot send a friend request to yourself' }, { status: 400 });
    }

    await connect();

    const alreadyFriends = await UserContactModel.findOne({
      ownerId: userObjectId,
      contactUserId: targetUserId,
      state: { $in: ['friend', 'favoriteFriend'] },
    }).lean();
    if (alreadyFriends) {
      return NextResponse.json({ error: 'Already friends with this user' }, { status: 400 });
    }

    const allFriendRequestConvs = await ConversationModel.find({ type: 'friend_request' })
      .select('_id')
      .lean();
    const convIds = (allFriendRequestConvs as { _id: mongoose.Types.ObjectId }[]).map((c) => c._id);
    if (convIds.length > 0) {
      const pending = await InboxMessageModel.findOne({
        conversationId: { $in: convIds },
        fromRef: userObjectId,
        'toRefs.ref': targetUserId,
      }).lean();
      if (pending) {
        return NextResponse.json(
          { error: 'You already have a pending friend request to this user' },
          { status: 400 }
        );
      }
    }

    const requesterName =
      session.user.name ||
      (session.user as { email?: string | null }).email ||
      'Someone';

    const conversation = await ConversationModel.create({
      type: 'friend_request',
      subject: `Friend request from ${requesterName}`,
    });

    await InboxMessageModel.create({
      conversationId: conversation._id,
      fromType: 'user',
      fromRef: userObjectId,
      toRefs: [{ type: 'user', ref: targetUserId }],
      body: `${requesterName} would like to be your friend.`,
    });

    const now = new Date();
    await UserConversationStateModel.insertMany([
      {
        userId: userObjectId,
        conversationId: conversation._id,
        folder: 'sent',
        readAt: now,
        starred: false,
        labels: [],
      },
      {
        userId: targetUserId,
        conversationId: conversation._id,
        folder: 'friend_requests',
        readAt: null,
        starred: false,
        labels: [],
      },
    ]);

    return NextResponse.json({
      id: conversation._id.toString(),
      type: 'friend_request',
      subject: conversation.subject,
      updatedAt: conversation.updatedAt,
    });
  } catch (e) {
    console.error('POST /api/inbox/friend-request:', e);
    return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
  }
}
