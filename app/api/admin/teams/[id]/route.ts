import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import TeamModel from '@/models/Team';
import { requireAdmin } from '@/lib/adminAuth';
import type { ITeam } from '@/models/Team';

const STATUS_VALUES = ['active', 'inactive', 'archived'] as const;

function toId(value: unknown): mongoose.Types.ObjectId | null {
  if (!value || typeof value !== 'string') return null;
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
}

type TeamDoc = ITeam & { _id: mongoose.Types.ObjectId };
type PopulatedDoc = Omit<TeamDoc, 'companyId' | 'locationId'> & {
  companyId?: { _id: mongoose.Types.ObjectId; name: string } | null;
  locationId?: { _id: mongoose.Types.ObjectId; name: string } | null;
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
    const doc = await TeamModel.findById(id)
      .populate('companyId', 'name')
      .populate('locationId', 'name')
      .lean() as PopulatedDoc | null;
    if (!doc) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type ?? null,
      status: doc.status ?? 'active',
      companyId:
        doc.companyId && typeof doc.companyId === 'object' && '_id' in doc.companyId
          ? (doc.companyId as { _id: mongoose.Types.ObjectId })._id.toString()
          : null,
      companyName:
        doc.companyId && typeof doc.companyId === 'object' && 'name' in doc.companyId
          ? (doc.companyId as { name: string }).name
          : null,
      locationId:
        doc.locationId && typeof doc.locationId === 'object' && '_id' in doc.locationId
          ? (doc.locationId as { _id: mongoose.Types.ObjectId })._id.toString()
          : null,
      locationName:
        doc.locationId && typeof doc.locationId === 'object' && 'name' in doc.locationId
          ? (doc.locationId as { name: string }).name
          : null,
    });
  } catch (e) {
    console.error('GET /api/admin/teams/[id]:', e);
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
    const { companyId, locationId, name, type, status } = body as {
      companyId?: string | null;
      locationId?: string | null;
      name?: string;
      type?: string;
      status?: string;
    };
    const update: Record<string, unknown> = {};
    if (companyId !== undefined) update.companyId = toId(companyId) ?? null;
    if (locationId !== undefined) update.locationId = toId(locationId) ?? null;
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (type !== undefined) update.type = typeof type === 'string' && type.trim() ? type.trim() : null;
    if (status !== undefined && STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
      update.status = status;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await connect();
    const doc = await TeamModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean() as (ITeam & { _id: mongoose.Types.ObjectId }) | null;
    if (!doc) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type ?? null,
      status: doc.status ?? 'active',
      companyId: doc.companyId?.toString() ?? null,
      locationId: doc.locationId?.toString() ?? null,
    });
  } catch (e) {
    console.error('PATCH /api/admin/teams/[id]:', e);
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
    const doc = await TeamModel.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/admin/teams/[id]:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
