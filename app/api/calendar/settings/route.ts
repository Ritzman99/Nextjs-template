import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import CalendarSettingsModel, { type ICalendarSettings } from '@/models/CalendarSettings';

/**
 * GET: Return the current user's calendar settings (timezone). Defaults to null (use browser time).
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
  const doc = (await CalendarSettingsModel.findOne({ userId: userObjectId }).lean()) as ICalendarSettings | null;
  return NextResponse.json({
    timezone: doc?.timezone ?? null,
  });
}

/**
 * PATCH: Update calendar settings. Body: { timezone?: string | null }
 * timezone: IANA timezone string (e.g. America/Los_Angeles) or null to use browser time.
 */
export async function PATCH(request: Request) {
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

  let body: { timezone?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const timezone =
    body.timezone === null || body.timezone === undefined
      ? null
      : typeof body.timezone === 'string'
        ? body.timezone.trim() || null
        : null;

  if (timezone !== null) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }
  }

  await connect();
  const doc = (await CalendarSettingsModel.findOneAndUpdate(
    { userId: userObjectId },
    { $set: { timezone } },
    { new: true, upsert: true }
  ).lean()) as ICalendarSettings | null;

  return NextResponse.json({ timezone: doc?.timezone ?? null });
}
