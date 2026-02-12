import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import LocationModel from '@/models/Location';
import { requireAdmin } from '@/lib/adminAuth';
import type { ILocation } from '@/models/Location';

const STATUS_VALUES = ['active', 'inactive', 'archived'] as const;

function toId(value: unknown): mongoose.Types.ObjectId | null {
  if (!value || typeof value !== 'string') return null;
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
}

type LocationDoc = ILocation & { _id: mongoose.Types.ObjectId };
type PopulatedDoc = Omit<LocationDoc, 'companyId'> & {
  companyId?: { _id: mongoose.Types.ObjectId; name: string } | null;
};

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
    const doc = await LocationModel.findById(id)
      .populate('companyId', 'name')
      .lean() as PopulatedDoc | null;
    if (!doc) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      code: doc.code ?? null,
      status: doc.status ?? 'active',
      companyId:
        doc.companyId && typeof doc.companyId === 'object' && '_id' in doc.companyId
          ? (doc.companyId as { _id: mongoose.Types.ObjectId })._id.toString()
          : null,
      companyName:
        doc.companyId && typeof doc.companyId === 'object' && 'name' in doc.companyId
          ? (doc.companyId as { name: string }).name
          : null,
    });
  } catch (e) {
    console.error('GET /api/admin/locations/[id]:', e);
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
    const { companyId, name, code, status } = body as {
      companyId?: string | null;
      name?: string;
      code?: string;
      status?: string;
    };
    const update: Record<string, unknown> = {};
    if (companyId !== undefined) update.companyId = toId(companyId) ?? null;
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (code !== undefined) update.code = typeof code === 'string' && code.trim() ? code.trim() : null;
    if (status !== undefined && STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
      update.status = status;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await connect();
    const doc = await LocationModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean() as (ILocation & { _id: mongoose.Types.ObjectId }) | null;
    if (!doc) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      code: doc.code ?? null,
      status: doc.status ?? 'active',
      companyId: doc.companyId?.toString() ?? null,
    });
  } catch (e) {
    console.error('PATCH /api/admin/locations/[id]:', e);
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
    const doc = await LocationModel.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/admin/locations/[id]:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
