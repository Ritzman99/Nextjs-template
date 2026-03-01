import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import ConversationModel from '@/models/Conversation';
import InboxMessageModel from '@/models/InboxMessage';
import UserConversationStateModel from '@/models/UserConversationState';
import UserModel from '@/models/User';
import ContactModel from '@/models/Contact';

export async function GET(
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

    await connect();

    const conversationId = new mongoose.Types.ObjectId(id);
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

    const messages = await InboxMessageModel.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    const userIds = new Set<string>();
    const contactIds = new Set<string>();
    for (const m of messages) {
      const msg = m as unknown as { fromType: string; fromRef: mongoose.Types.ObjectId; toRefs: Array<{ type: string; ref: mongoose.Types.ObjectId }> };
      if (msg.fromType === 'user') userIds.add(msg.fromRef.toString());
      else contactIds.add(msg.fromRef.toString());
      for (const t of msg.toRefs || []) {
        if (t.type === 'user') userIds.add(t.ref.toString());
        else contactIds.add(t.ref.toString());
      }
    }

    const users = await UserModel.find({ _id: { $in: Array.from(userIds).map((id) => new mongoose.Types.ObjectId(id)) } })
      .select('_id userId email name firstName lastName username')
      .lean();
    const userMap = new Map(
      (users as unknown as { _id: mongoose.Types.ObjectId; userId?: string; email: string; name?: string; firstName?: string; lastName?: string; username?: string }[]).map(
        (u) => [
          u._id.toString(),
          {
            id: u.userId ?? u._id.toString(),
            name: u.name?.trim() || [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username || u.email,
            email: u.email,
          },
        ]
      )
    );
    const contacts = await ContactModel.find({ _id: { $in: Array.from(contactIds).map((id) => new mongoose.Types.ObjectId(id)) } })
      .select('_id identifier displayName')
      .lean();
    const contactMap = new Map(
      (contacts as unknown as { _id: mongoose.Types.ObjectId; identifier: string; displayName: string }[]).map((c) => [
        c._id.toString(),
        { id: c.identifier, name: c.displayName, email: c.identifier },
      ])
    );

    const messagesWithSenders = messages.map((m) => {
      const msg = m as unknown as IInboxMessageLean;
      const fromKey = msg.fromRef.toString();
      const fromDisplay = msg.fromType === 'user' ? userMap.get(fromKey) : contactMap.get(fromKey);
      return {
        id: msg._id.toString(),
        fromType: msg.fromType,
        fromRef: fromKey,
        fromDisplay: fromDisplay ?? { id: fromKey, name: '', email: '' },
        toRefs: (msg.toRefs || []).map((t) => {
          const key = t.ref.toString();
          const display = t.type === 'user' ? userMap.get(key) : contactMap.get(key);
          return { type: t.type, ref: key, display: display ?? { id: key, name: '', email: '' } };
        }),
        body: msg.body,
        inReplyToId: msg.inReplyToId?.toString() ?? null,
        createdAt: msg.createdAt,
      };
    });

    const conv = conversation as unknown as { _id: mongoose.Types.ObjectId; type: string; subject?: string; updatedAt: Date };
    const st = state as unknown as { folder: string; labels: string[]; readAt?: Date | null; starred: boolean };
    return NextResponse.json({
      conversation: {
        id: conv._id.toString(),
        type: conv.type,
        subject: conv.subject ?? null,
        updatedAt: conv.updatedAt,
      },
      state: {
        folder: st.folder,
        labels: st.labels ?? [],
        readAt: st.readAt ?? null,
        starred: st.starred,
      },
      messages: messagesWithSenders,
    });
  } catch (e) {
    console.error('GET /api/inbox/conversations/[id]:', e);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}

interface IInboxMessageLean {
  _id: mongoose.Types.ObjectId;
  fromType: string;
  fromRef: mongoose.Types.ObjectId;
  toRefs?: Array<{ type: string; ref: mongoose.Types.ObjectId }>;
  body: string;
  inReplyToId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

/** Permanent delete: only allowed when current user has conversation in trash. */
export async function DELETE(
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

    const conversationId = new mongoose.Types.ObjectId(id);
    await connect();

    const state = await UserConversationStateModel.findOne({
      userId: userObjectId,
      conversationId,
    }).lean();
    if (!state) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }
    const stateFolder = (state as unknown as { folder: string }).folder;
    if (stateFolder !== 'trash') {
      return NextResponse.json({ error: 'Conversation must be in trash to delete permanently' }, { status: 400 });
    }

    await InboxMessageModel.deleteMany({ conversationId });
    await UserConversationStateModel.deleteMany({ conversationId });
    await ConversationModel.deleteOne({ _id: conversationId });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('DELETE /api/inbox/conversations/[id]:', e);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
