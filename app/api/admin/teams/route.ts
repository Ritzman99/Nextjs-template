import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import TeamModel from '@/models/Team';
import { requireAdmin } from '@/lib/adminAuth';
import type { ITeam } from '@/models/Team';

const STATUS_VALUES = ['active', 'inactive', 'archived'] as const;

function toStatus(value: unknown): 'active' | 'inactive' | 'archived' {
  if (value === 'active' || value === 'inactive' || value === 'archived') return value;
  return 'active';
}

function toId(value: unknown): mongoose.Types.ObjectId | null {
  if (!value || typeof value !== 'string') return null;
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
}

type TeamDoc = ITeam & { _id: mongoose.Types.ObjectId };
type PopulatedDoc = Omit<TeamDoc, 'companyId' | 'locationId'> & {
  companyId?: { _id: mongoose.Types.ObjectId; name: string } | null;
  locationId?: { _id: mongoose.Types.ObjectId; name: string } | null;
};

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status') ?? undefined;
    const companyId = searchParams.get('companyId') ?? undefined;
    const locationId = searchParams.get('locationId') ?? undefined;

    await connect();
    const filter: Record<string, unknown> = {};
    if (companyId && mongoose.isValidObjectId(companyId)) {
      filter.companyId = new mongoose.Types.ObjectId(companyId);
    }
    if (locationId && mongoose.isValidObjectId(locationId)) {
      filter.locationId = new mongoose.Types.ObjectId(locationId);
    }
    if (status && STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const docs = await TeamModel.find(filter)
      .populate('companyId', 'name')
      .populate('locationId', 'name')
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });
    const total = await TeamModel.countDocuments(filter);

    const teams = (docs as unknown as PopulatedDoc[]).map((d) => ({
      id: d._id.toString(),
      name: d.name,
      type: d.type ?? null,
      status: d.status ?? 'active',
      companyId:
        d.companyId && typeof d.companyId === 'object' && '_id' in d.companyId
          ? (d.companyId as { _id: mongoose.Types.ObjectId })._id.toString()
          : null,
      companyName:
        d.companyId && typeof d.companyId === 'object' && 'name' in d.companyId
          ? (d.companyId as { name: string }).name
          : null,
      locationId:
        d.locationId && typeof d.locationId === 'object' && '_id' in d.locationId
          ? (d.locationId as { _id: mongoose.Types.ObjectId })._id.toString()
          : null,
      locationName:
        d.locationId && typeof d.locationId === 'object' && 'name' in d.locationId
          ? (d.locationId as { name: string }).name
          : null,
    }));

    return NextResponse.json({
      teams,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('GET /api/admin/teams:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = await request.json();
    const { companyId, locationId, name, type, status } = body as {
      companyId?: string | null;
      locationId?: string | null;
      name?: string;
      type?: string;
      status?: string;
    };
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    await connect();
    const doc = await TeamModel.create({
      companyId: toId(companyId) ?? undefined,
      locationId: toId(locationId) ?? undefined,
      name: name.trim(),
      type: typeof type === 'string' && type.trim() ? type.trim() : undefined,
      status: toStatus(status),
    });

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type ?? null,
      status: doc.status ?? 'active',
      companyId: doc.companyId?.toString() ?? null,
      locationId: doc.locationId?.toString() ?? null,
    });
  } catch (e) {
    console.error('POST /api/admin/teams:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
