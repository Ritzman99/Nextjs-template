import { NextResponse } from 'next/server';
import { seedUsers } from '@/lib/seedUsers';

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Setup seed is only allowed in development' },
      { status: 403 }
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const roleCounts =
      typeof body.roleCounts === 'object' && body.roleCounts !== null
        ? (body.roleCounts as Record<string, number>)
        : {};
    const defaultPassword =
      typeof body.defaultPassword === 'string' && body.defaultPassword
        ? body.defaultPassword
        : 'password';

    const { created } = await seedUsers({ roleCounts, defaultPassword });
    return NextResponse.json({
      ok: true,
      message: `Users seeded: ${created} created.`,
    });
  } catch (e) {
    console.error('POST /api/setup/seed/users:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}
