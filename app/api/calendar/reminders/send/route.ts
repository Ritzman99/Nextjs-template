import { NextResponse } from 'next/server';
import { processInboxReminders } from '@/lib/eventReminders';

/**
 * POST: Process due event reminders and post to inbox.
 * Intended to be called by a cron (e.g. every 5–10 minutes).
 * Optional body: { windowMinutes?: number } (default 10).
 */
export async function POST(request: Request) {
  let windowMinutes = 10;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.windowMinutes === 'number' && body.windowMinutes > 0 && body.windowMinutes <= 60) {
      windowMinutes = body.windowMinutes;
    }
  } catch {
    // use default
  }

  const { sent } = await processInboxReminders(windowMinutes);
  return NextResponse.json({ sent });
}
