import { NextResponse } from 'next/server';
import connect from '@/lib/mongoose';
import SectionModel from '@/models/Section';
import { SECTIONS } from '@/lib/sections';

/**
 * Setup-only section seed. In development, seeds from current SECTIONS (no auth).
 * Run after apply script so lib/sections.ts reflects config.
 */
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Setup seed is only allowed in development' },
      { status: 403 }
    );
  }
  try {
    await connect();
    let created = 0;
    let updated = 0;
    for (const s of SECTIONS) {
      const result = await SectionModel.updateOne(
        { slug: s.id },
        {
          $set: {
            name: s.label,
            slug: s.id,
            allowedActions: [...s.allowedActions],
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount) created += 1;
      else if (result.modifiedCount) updated += 1;
    }
    return NextResponse.json({
      ok: true,
      message: `Seeded sections: ${created} created, ${updated} updated.`,
    });
  } catch (e) {
    console.error('POST /api/setup/seed/sections:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}
