import { NextResponse } from 'next/server';
import { readProjectConfig } from '@/lib/projectConfig';
import { seedSetupRoles } from '@/lib/seedSetupRoles';

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Setup seed is only allowed in development' },
      { status: 403 }
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const preset = (body.preset === 'extended' ? 'extended' : 'basic') as 'basic' | 'extended';
    const config = readProjectConfig();
    const organization = config?.organization ?? 'full';

    const { created, updated } = await seedSetupRoles(preset, organization);
    return NextResponse.json({
      ok: true,
      message: `Roles seeded: ${created} created, ${updated} updated (preset: ${preset}).`,
    });
  } catch (e) {
    console.error('POST /api/setup/seed/roles:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}
