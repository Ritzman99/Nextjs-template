import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import connect from '@/lib/mongoose';
import CalendarModel from '@/models/Calendar';
import { getOrCreateDefaultCalendar } from '@/lib/calendar';

/**
 * GET: List calendars for the current user.
 * Ensures default calendar exists (getOrCreateDefaultCalendar), then returns owned calendars.
 */
export async function GET() {
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

  await connect();

  await getOrCreateDefaultCalendar(userObjectId);

  const calendars = await CalendarModel.find({ ownerId: userObjectId })
    .select('_id name description color visibility isDefault createdAt updatedAt')
    .sort({ isDefault: -1, name: 1 })
    .lean();

  const list = calendars.map((c: Record<string, unknown>) => ({
    id: (c._id as import('mongoose').Types.ObjectId).toString(),
    name: (c.name as string) ?? '',
    description: (c.description as string | null) ?? null,
    color: (c.color as string | null) ?? null,
    visibility: (c.visibility as string) ?? 'private',
    isDefault: (c.isDefault as boolean) ?? false,
    createdAt: c.createdAt as Date,
    updatedAt: c.updatedAt as Date,
  }));

  return NextResponse.json({ calendars: list });
}
