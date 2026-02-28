import connect from '@/lib/mongoose';
import ContactModel from '@/models/Contact';

export const SYSTEM_CONTACT_IDENTIFIERS = [
  'system.news.app',
  'system.help.app',
  'system.admin.app',
  'system.report.app',
  'system.ticket.app',
] as const;

const DISPLAY_NAMES: Record<(typeof SYSTEM_CONTACT_IDENTIFIERS)[number], string> = {
  'system.news.app': 'News',
  'system.help.app': 'Help',
  'system.admin.app': 'Admin',
  'system.report.app': 'Reports',
  'system.ticket.app': 'Tickets',
};

export async function seedSystemContacts(): Promise<{ created: number; existing: number }> {
  await connect();
  let created = 0;
  let existing = 0;
  for (const identifier of SYSTEM_CONTACT_IDENTIFIERS) {
    const found = await ContactModel.findOne({ type: 'system', identifier }).lean();
    if (found) {
      existing++;
      continue;
    }
    await ContactModel.create({
      type: 'system',
      identifier,
      displayName: DISPLAY_NAMES[identifier],
    });
    created++;
  }
  return { created, existing };
}
