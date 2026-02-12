import { NextResponse } from 'next/server';
import connect from '@/lib/mongoose';
import SectionModel from '@/models/Section';
import { requireAdmin } from '@/lib/adminAuth';
import { SECTIONS } from '@/lib/sections';

/**
 * One-time seed: inserts current SECTIONS from lib/sections.ts into the Section collection.
 * Only allowed in development. Use to bootstrap the DB so admin CRUD and Generate Enums work.
 */
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Seed sections is only allowed in development' },
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
    console.error('POST /api/admin/sections/seed:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}
