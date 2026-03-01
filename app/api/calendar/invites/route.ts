import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import UserEventStateModel from '@/models/UserEventState';

/**
 * GET: List event invites for the current user.
 * Query: rsvp (optional) - filter by 'needs_action' | 'yes' | 'no' | 'maybe'. Default: needs_action.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userObjectId = await getCurrentUserObjectId(
    session.user.id,
    (session.user as { email?: string | null }).email
  );
  if (!userObjectId) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rsvpFilter = searchParams.get('rsvp') ?? 'needs_action';
  if (!['needs_action', 'yes', 'no', 'maybe'].includes(rsvpFilter)) {
    return NextResponse.json({ error: 'Invalid rsvp filter' }, { status: 400 });
  }

  await connect();

  const states = await UserEventStateModel.find({
    userId: userObjectId,
    rsvp: rsvpFilter,
    hidden: false,
  })
    .sort({ eventStartAt: 1 })
    .lean();

  const list = states.map((s: Record<string, unknown>) => ({
    eventId: (s.eventId as mongoose.Types.ObjectId).toString(),
    rsvp: (s.rsvp as string) ?? 'needs_action',
    responseAt: (s.responseAt as Date | null) ?? null,
    readAt: (s.readAt as Date | null) ?? null,
    eventStartAt: (s.eventStartAt as Date | null) ?? null,
    eventEndAt: (s.eventEndAt as Date | null) ?? null,
    eventTitle: (s.eventTitle as string | null) ?? null,
    eventStatus: (s.eventStatus as string | null) ?? null,
  }));

  return NextResponse.json({ invites: list });
}
