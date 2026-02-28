import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import UserConversationStateModel from '@/models/UserConversationState';

export async function GET() {
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
      return NextResponse.json({ count: 0 });
    }

    await connect();

    const count = await UserConversationStateModel.countDocuments({
      userId: userObjectId,
      folder: 'inbox',
      readAt: null,
    });

    return NextResponse.json({ count });
  } catch (e) {
    console.error('GET /api/inbox/unread-count:', e);
    return NextResponse.json({ count: 0 });
  }
}
