import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import SecurityRoleModel, { type ISecurityRole } from '@/models/SecurityRole';
import SectionModel from '@/models/Section';
import { requireAdmin } from '@/lib/adminAuth';

function toId(value: unknown): mongoose.Types.ObjectId | null {
  if (!value || typeof value !== 'string') return null;
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
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
    const doc = await SecurityRoleModel.findById(id).lean() as (ISecurityRole & { _id: mongoose.Types.ObjectId }) | null;
    if (!doc) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      scopeLevel: doc.scopeLevel,
      companyId: doc.companyId?.toString() ?? null,
      locationId: doc.locationId?.toString() ?? null,
      teamId: doc.teamId?.toString() ?? null,
      permissions: doc.permissions ?? [],
    });
  } catch (e) {
    console.error('GET /api/admin/roles/[id]:', e);
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
    const update: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (['global', 'company', 'location', 'team'].includes(scopeLevel ?? '')) {
      update.scopeLevel = scopeLevel;
    }
    if (companyId !== undefined) update.companyId = toId(companyId) ?? null;
    if (locationId !== undefined) update.locationId = toId(locationId) ?? null;
    if (teamId !== undefined) update.teamId = toId(teamId) ?? null;
    if (Array.isArray(permissions)) {
      await connect();
      const validSlugs = new Set(await SectionModel.distinct('slug'));
      validSlugs.add('*');
      update.permissions = permissions
        .filter((p) => p && typeof p.section === 'string' && Array.isArray(p.actions))
        .map((p) => ({
          section: p.section,
          actions: (p.actions as string[]).filter((a) => typeof a === 'string'),
        }))
        .filter((p) => validSlugs.has(p.section));
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    await connect();
    const doc = await SecurityRoleModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean() as (ISecurityRole & { _id: mongoose.Types.ObjectId }) | null;
    if (!doc) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      scopeLevel: doc.scopeLevel,
      companyId: doc.companyId?.toString() ?? null,
      locationId: doc.locationId?.toString() ?? null,
      teamId: doc.teamId?.toString() ?? null,
      permissions: doc.permissions ?? [],
    });
  } catch (e) {
    console.error('PATCH /api/admin/roles/[id]:', e);
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
    const doc = await SecurityRoleModel.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/admin/roles/[id]:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
