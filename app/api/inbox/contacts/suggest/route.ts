import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSuggestions } from '@/lib/inboxResolver';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? undefined;
  try {
    const suggestions = await getSuggestions(session.user.id, q);
    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error('GET /api/inbox/contacts/suggest:', e);
    return NextResponse.json({ error: 'Failed to get suggestions' }, { status: 500 });
  }
}
