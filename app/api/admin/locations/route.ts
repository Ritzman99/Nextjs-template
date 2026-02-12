import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import LocationModel from '@/models/Location';
import { requireAdmin } from '@/lib/adminAuth';
import type { ILocation } from '@/models/Location';

const STATUS_VALUES = ['active', 'inactive', 'archived'] as const;

function toStatus(value: unknown): 'active' | 'inactive' | 'archived' {
  if (value === 'active' || value === 'inactive' || value === 'archived') return value;
  return 'active';
}

function toId(value: unknown): mongoose.Types.ObjectId | null {
  if (!value || typeof value !== 'string') return null;
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
}

type LocationDoc = ILocation & { _id: mongoose.Types.ObjectId; companyId?: mongoose.Types.ObjectId | null };
type PopulatedDoc = Omit<LocationDoc, 'companyId'> & {
  companyId?: { _id: mongoose.Types.ObjectId; name: string } | null;
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

    await connect();
    const filter: Record<string, unknown> = {};
    if (companyId && mongoose.isValidObjectId(companyId)) {
      filter.companyId = new mongoose.Types.ObjectId(companyId);
    }
    if (status && STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const docs = await LocationModel.find(filter)
      .populate('companyId', 'name')
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });
    const total = await LocationModel.countDocuments(filter);

    const locations = (docs as unknown as PopulatedDoc[]).map((d) => ({
      id: d._id.toString(),
      name: d.name,
      code: d.code ?? null,
      status: d.status ?? 'active',
      companyId: d.companyId && typeof d.companyId === 'object' && '_id' in d.companyId
        ? (d.companyId as { _id: mongoose.Types.ObjectId })._id.toString()
        : null,
      companyName:
        d.companyId && typeof d.companyId === 'object' && 'name' in d.companyId
          ? (d.companyId as { name: string }).name
          : null,
    }));

    return NextResponse.json({
      locations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('GET /api/admin/locations:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = await request.json();
    const { companyId, name, code, status } = body as {
      companyId?: string | null;
      name?: string;
      code?: string;
      status?: string;
    };
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    await connect();
    const doc = await LocationModel.create({
      companyId: toId(companyId) ?? undefined,
      name: name.trim(),
      code: typeof code === 'string' && code.trim() ? code.trim() : undefined,
      status: toStatus(status),
    });

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      code: doc.code ?? null,
      status: doc.status ?? 'active',
      companyId: doc.companyId?.toString() ?? null,
    });
  } catch (e) {
    console.error('POST /api/admin/locations:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
