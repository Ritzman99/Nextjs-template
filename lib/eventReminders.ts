import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import UserEventStateModel from '@/models/UserEventState';
import EventModel from '@/models/Event';
import EventActivityModel from '@/models/EventActivity';
import InboxMessageModel from '@/models/InboxMessage';

/**
 * Process event reminders: find UserEventState with inbox reminders due in the next window,
 * send InboxMessage to the event conversation and record EventActivity.
 * Idempotent per (eventId, minutesBefore) using EventActivity.
 * Call from a cron (e.g. every 5 min) with windowMinutes ~10.
 */
export async function processInboxReminders(windowMinutes: number = 10): Promise<{ sent: number }> {
  await connect();

  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);

  const states = await UserEventStateModel.find({
    eventStartAt: { $gte: now, $lte: windowEnd },
    eventStatus: 'scheduled',
    'reminders.0': { $exists: true },
  })
    .select('userId eventId eventStartAt eventTitle reminders')
    .lean();

  let sent = 0;
  for (const s of states) {
    const state = s as unknown as {
      userId: mongoose.Types.ObjectId;
      eventId: mongoose.Types.ObjectId;
      eventStartAt: Date;
      eventTitle?: string | null;
      reminders: Array<{ minutesBefore: number; channel: string; enabled: boolean }>;
    };
    const eventStart = new Date(state.eventStartAt);
    for (const rem of state.reminders) {
      if (rem.channel !== 'inbox' || !rem.enabled) continue;
      const reminderAt = new Date(eventStart.getTime() - rem.minutesBefore * 60 * 1000);
      if (reminderAt > now) continue;
      const alreadySent = await EventActivityModel.findOne({
        eventId: state.eventId,
        kind: 'reminder_sent',
        'diff.minutesBefore': rem.minutesBefore,
      }).lean();
      if (alreadySent) continue;

      const event = await EventModel.findById(state.eventId).select('conversationId organizerType organizerRef').lean();
      if (!event || (event as unknown as { eventStatus?: string }).eventStatus === 'cancelled') continue;
      const ev = event as unknown as { conversationId?: mongoose.Types.ObjectId | null; organizerType: string; organizerRef: mongoose.Types.ObjectId };
      if (!ev.conversationId) continue;

      const title = (state.eventTitle ?? 'Event').toString();
      const body = `Reminder: "${title}" starts in ${rem.minutesBefore} minute${rem.minutesBefore === 1 ? '' : 's'}.`;

      await InboxMessageModel.create({
        conversationId: ev.conversationId,
        fromType: ev.organizerType as 'user' | 'contact',
        fromRef: ev.organizerRef,
        toRefs: [{ type: 'user' as const, ref: state.userId }],
        body,
      });

      await EventActivityModel.create({
        eventId: state.eventId,
        actorType: 'system',
        kind: 'reminder_sent',
        summary: `${rem.minutesBefore} min before`,
        diff: { minutesBefore: rem.minutesBefore },
      });
      sent++;
    }
  }
  return { sent };
}
