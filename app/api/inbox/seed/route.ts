import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ADMIN_ROLE } from '@/lib/adminConstants';
import { seedSystemContacts } from '@/lib/seedSystemContacts';

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== ADMIN_ROLE) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const result = await seedSystemContacts();
    return NextResponse.json(result);
  } catch (e) {
    console.error('POST /api/inbox/seed:', e);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
