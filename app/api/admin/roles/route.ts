import { NextResponse } from 'next/server';
import connect from '@/lib/mongoose';
import SecurityRoleModel from '@/models/SecurityRole';
import SectionModel from '@/models/Section';
import { requireAdmin } from '@/lib/adminAuth';
import mongoose from 'mongoose';

function toId(value: unknown): mongoose.Types.ObjectId | null {
  if (!value || typeof value !== 'string') return null;
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    await connect();
    const roles = await SecurityRoleModel.find({}).lean().sort({ name: 1 });
    const list = roles.map((r) => ({
      id: (r as { _id: { toString(): string } })._id.toString(),
      name: r.name,
      scopeLevel: r.scopeLevel,
      companyId: r.companyId?.toString() ?? null,
      locationId: r.locationId?.toString() ?? null,
      teamId: r.teamId?.toString() ?? null,
      permissions: r.permissions ?? [],
      permissionCount: (r.permissions ?? []).length,
    }));
    return NextResponse.json(list);
  } catch (e) {
    console.error('GET /api/admin/roles:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = await request.json();
    const {
      name,
      scopeLevel,
      companyId,
      locationId,
      teamId,
      permissions,
    } = body as {
      name?: string;
      scopeLevel?: string;
      companyId?: string | null;
      locationId?: string | null;
      teamId?: string | null;
      permissions?: Array<{ section: string; actions: string[] }>;
    };
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    const validScope = ['global', 'company', 'location', 'team'].includes(scopeLevel ?? '') ? scopeLevel : 'global';
    await connect();
    const validSlugs = new Set(await SectionModel.distinct('slug'));
    validSlugs.add('*');
    const perms = Array.isArray(permissions)
      ? permissions
          .filter((p) => p && typeof p.section === 'string' && Array.isArray(p.actions))
          .map((p) => ({
            section: p.section,
            actions: (p.actions as string[]).filter((a) => typeof a === 'string'),
          }))
          .filter((p) => validSlugs.has(p.section))
      : [];
    const doc = await SecurityRoleModel.create({
      name: name.trim(),
      scopeLevel: validScope,
      companyId: toId(companyId) ?? undefined,
      locationId: toId(locationId) ?? undefined,
      teamId: toId(teamId) ?? undefined,
      permissions: perms,
    });
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      scopeLevel: doc.scopeLevel,
      companyId: doc.companyId?.toString() ?? null,
      locationId: doc.locationId?.toString() ?? null,
      teamId: doc.teamId?.toString() ?? null,
      permissions: doc.permissions,
    });
  } catch (e) {
    console.error('POST /api/admin/roles:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
