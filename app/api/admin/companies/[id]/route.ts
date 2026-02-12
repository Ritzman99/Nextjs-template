import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import CompanyModel from '@/models/Company';
import { requireAdmin } from '@/lib/adminAuth';
import type { ICompany } from '@/models/Company';

const STATUS_VALUES = ['active', 'inactive', 'archived'] as const;

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
    const doc = await CompanyModel.findById(id).lean() as (ICompany & { _id: mongoose.Types.ObjectId }) | null;
    if (!doc) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug ?? null,
      status: doc.status ?? 'active',
    });
  } catch (e) {
    console.error('GET /api/admin/companies/[id]:', e);
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
    const { name, slug, status } = body as { name?: string; slug?: string; status?: string };
    const update: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (slug !== undefined) update.slug = typeof slug === 'string' && slug.trim() ? slug.trim() : null;
    if (status !== undefined && STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
      update.status = status;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await connect();
    const doc = await CompanyModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean() as (ICompany & { _id: mongoose.Types.ObjectId }) | null;
    if (!doc) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug ?? null,
      status: doc.status ?? 'active',
    });
  } catch (e) {
    console.error('PATCH /api/admin/companies/[id]:', e);
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
    const doc = await CompanyModel.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/admin/companies/[id]:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
