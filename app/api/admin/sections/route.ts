import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import SectionModel from '@/models/Section';
import { requireAdmin } from '@/lib/adminAuth';
import type { ISection } from '@/models/Section';

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    await connect();
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const docs = await SectionModel.find(filter).lean().sort({ slug: 1 });
    const sections = (docs as unknown as (ISection & { _id: mongoose.Types.ObjectId })[]).map((d) => ({
      id: d._id.toString(),
      name: d.name,
      slug: d.slug,
      allowedActions: d.allowedActions ?? [],
    }));

    return NextResponse.json(sections);
  } catch (e) {
    console.error('GET /api/admin/sections:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = await request.json();
    const { name, slug, allowedActions } = body as {
      name?: string;
      slug?: string;
      allowedActions?: string[];
    };
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    const rawSlug = typeof slug === 'string' && slug.trim() ? slug.trim() : name.trim();
    const normalizedSlug = normalizeSlug(rawSlug);
    if (!isValidSlug(normalizedSlug)) {
      return NextResponse.json(
        { error: 'slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      );
    }

    const actions =
      Array.isArray(allowedActions) && allowedActions.every((a) => typeof a === 'string')
        ? allowedActions
        : undefined;

    await connect();
    const doc = await SectionModel.create({
      name: name.trim(),
      slug: normalizedSlug,
      ...(actions !== undefined && { allowedActions: actions }),
    });

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      allowedActions: doc.allowedActions ?? [],
    });
  } catch (e) {
    if (e instanceof mongoose.mongo.MongoServerError && e.code === 11000) {
      return NextResponse.json({ error: 'A section with this slug already exists' }, { status: 409 });
    }
    console.error('POST /api/admin/sections:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
