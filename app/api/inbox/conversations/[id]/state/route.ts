import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import UserConversationStateModel from '@/models/UserConversationState';
import type { InboxFolder } from '@/models/UserConversationState';

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
    const userObjectId = await getCurrentUserObjectId(session.user.id);
    if (!userObjectId) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const body = await request.json();
    const { folder, starred, labels, readAt } = body as {
      folder?: InboxFolder;
      starred?: boolean;
      labels?: string[];
      readAt?: Date | string | null;
    };

    const conversationId = new mongoose.Types.ObjectId(id);
    await connect();

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (folder !== undefined) {
      const valid: InboxFolder[] = ['inbox', 'sent', 'draft', 'starred', 'trash', 'spam'];
      if (valid.includes(folder)) update.folder = folder;
    }
    if (starred !== undefined) update.starred = Boolean(starred);
    if (labels !== undefined) update.labels = Array.isArray(labels) ? labels : [];
    if (readAt !== undefined) update.readAt = readAt === null || readAt === '' ? null : readAt ? new Date(readAt) : undefined;

    const state = await UserConversationStateModel.findOneAndUpdate(
      { userId: userObjectId, conversationId },
      { $set: update },
      { new: true }
    ).lean();

    if (!state) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    const st = state as unknown as { folder: string; labels: string[]; readAt?: Date | null; starred: boolean };
    return NextResponse.json({
      folder: st.folder,
      labels: st.labels ?? [],
      readAt: st.readAt ?? null,
      starred: st.starred,
    });
  } catch (e) {
    console.error('PATCH /api/inbox/conversations/[id]/state:', e);
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  }
}
