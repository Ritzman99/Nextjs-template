import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { resolveRecipient } from '@/lib/inboxResolver';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get('identifier');
  if (!identifier || !identifier.trim()) {
    return NextResponse.json({ error: 'identifier is required' }, { status: 400 });
  }
  try {
    const resolved = await resolveRecipient(identifier.trim());
    if (!resolved) {
      return NextResponse.json({ resolved: null });
    }
    return NextResponse.json({
      resolved: { type: resolved.type, id: resolved.id.toString() },
    });
  } catch (e) {
    console.error('GET /api/inbox/contacts/resolve:', e);
    return NextResponse.json({ error: 'Failed to resolve' }, { status: 500 });
  }
}
