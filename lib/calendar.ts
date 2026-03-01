import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import CalendarModel from '@/models/Calendar';

/**
 * Get or create the default calendar for a user (MVP: one default calendar per user).
 * Call this when listing calendars or creating an event so the user always has a calendar.
 */
export async function getOrCreateDefaultCalendar(
  userId: mongoose.Types.ObjectId
): Promise<{ _id: mongoose.Types.ObjectId; name: string; color: string | null }> {
  await connect();

  let calendar = await CalendarModel.findOne({
    ownerId: userId,
    isDefault: true,
  })
    .select('_id name color')
    .lean();

  if (calendar) {
    const c = calendar as unknown as { _id: mongoose.Types.ObjectId; name: string; color?: string | null };
    return {
      _id: c._id,
      name: c.name,
      color: c.color ?? null,
    };
  }

  const created = await CalendarModel.create({
    ownerId: userId,
    name: 'My Calendar',
    visibility: 'private',
    isDefault: true,
  });

  return {
    _id: created._id,
    name: created.name,
    color: created.color ?? null,
  };
}
