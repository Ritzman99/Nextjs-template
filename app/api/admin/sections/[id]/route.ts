import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import SectionModel from '@/models/Section';
import SecurityRoleModel from '@/models/SecurityRole';
import { requireAdmin } from '@/lib/adminAuth';
import type { ISection } from '@/models/Section';

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  try {
    await connect();
    const doc = await SectionModel.findById(id).lean() as (ISection & { _id: mongoose.Types.ObjectId }) | null;
    if (!doc) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      allowedActions: doc.allowedActions ?? [],
    });
  } catch (e) {
    console.error('GET /api/admin/sections/[id]:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { name, slug, allowedActions } = body as {
      name?: string;
      slug?: string;
      allowedActions?: string[];
    };
    const update: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof slug === 'string' && slug.trim()) {
      const normalizedSlug = normalizeSlug(slug);
      if (!isValidSlug(normalizedSlug)) {
        return NextResponse.json(
          { error: 'slug must be lowercase letters, numbers, and hyphens only' },
          { status: 400 }
        );
      }
      update.slug = normalizedSlug;
    }
    if (Array.isArray(allowedActions) && allowedActions.every((a) => typeof a === 'string')) {
      update.allowedActions = allowedActions;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await connect();
    const doc = await SectionModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean() as (ISection & { _id: mongoose.Types.ObjectId }) | null;
    if (!doc) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }
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
    console.error('PATCH /api/admin/sections/[id]:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  try {
    await connect();
    const section = await SectionModel.findById(id).lean() as (ISection & { _id: mongoose.Types.ObjectId }) | null;
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }
    const sectionSlug = section.slug;
    const roleWithSection = await SecurityRoleModel.findOne({
      'permissions.section': sectionSlug,
    }).lean();
    if (roleWithSection) {
      return NextResponse.json(
        {
          error:
            'Cannot delete section: one or more roles reference it. Remove the section from role permissions first.',
        },
        { status: 400 }
      );
    }

    const doc = await SectionModel.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/admin/sections/[id]:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
