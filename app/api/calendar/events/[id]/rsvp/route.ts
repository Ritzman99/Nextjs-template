import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import UserModel from '@/models/User';
import { setEventRsvp, type RsvpValue } from '@/lib/eventService';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventIdParam } = await params;
  if (!eventIdParam || !mongoose.isValidObjectId(eventIdParam)) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  }

  let body: { rsvp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rsvp = body.rsvp;
  if (!rsvp || !['yes', 'no', 'maybe'].includes(rsvp)) {
    return NextResponse.json(
      { error: 'Body must include rsvp: "yes" | "no" | "maybe"' },
      { status: 400 }
    );
  }

  const userObjectId = await getCurrentUserObjectId(
    session.user.id,
    (session.user as { email?: string | null }).email
  );
  if (!userObjectId) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
  }

  const user = await UserModel.findById(userObjectId)
    .select('name email username')
    .lean();
  const displayName =
    (user as { name?: string; email?: string; username?: string } | null)?.name ||
    (user as { email?: string } | null)?.email ||
    (user as { username?: string } | null)?.username ||
    'Someone';

  const eventId = new mongoose.Types.ObjectId(eventIdParam);
  const result = await setEventRsvp(
    eventId,
    userObjectId,
    rsvp as RsvpValue,
    displayName
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? 'Failed to update RSVP' },
      { status: 400 }
    );
  }

  return NextResponse.json({ rsvp });
}
