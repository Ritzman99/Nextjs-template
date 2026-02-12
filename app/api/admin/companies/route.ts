import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import CompanyModel from '@/models/Company';
import { requireAdmin } from '@/lib/adminAuth';
import type { ICompany } from '@/models/Company';

const STATUS_VALUES = ['active', 'inactive', 'archived'] as const;

function toStatus(value: unknown): 'active' | 'inactive' | 'archived' {
  if (value === 'active' || value === 'inactive' || value === 'archived') return value;
  return 'active';
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status') ?? undefined;

    await connect();
    const filter: Record<string, unknown> = {};
    if (status && STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      CompanyModel.find(filter).lean().skip(skip).limit(limit).sort({ name: 1 }),
      CompanyModel.countDocuments(filter),
    ]);

    const companies = (docs as unknown as (ICompany & { _id: mongoose.Types.ObjectId })[]).map((d) => ({
      id: d._id.toString(),
      name: d.name,
      slug: d.slug ?? null,
      status: d.status ?? 'active',
    }));

    return NextResponse.json({
      companies,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('GET /api/admin/companies:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = await request.json();
    const { name, slug, status } = body as { name?: string; slug?: string; status?: string };
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    await connect();
    const doc = await CompanyModel.create({
      name: name.trim(),
      slug: typeof slug === 'string' && slug.trim() ? slug.trim() : undefined,
      status: toStatus(status),
    });

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug ?? null,
      status: doc.status ?? 'active',
    });
  } catch (e) {
    console.error('POST /api/admin/companies:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
