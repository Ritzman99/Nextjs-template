import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import UserModel from '@/models/User';
import { requireAdmin } from '@/lib/adminAuth';
import { profileToSafeUser } from '@/lib/adminUserHelpers';
import type { IUser } from '@/models/User';

type ProfileDoc = Pick<
  IUser,
  | 'userId'
  | 'email'
  | 'name'
  | 'image'
  | 'avatar'
  | 'avatarKey'
  | 'role'
  | 'companyId'
  | 'locationId'
  | 'teamId'
  | 'securityRoleId'
  | 'roleAssignments'
  | 'firstName'
  | 'lastName'
  | 'gender'
  | 'address'
  | 'age'
  | 'username'
  | 'region'
  | 'state'
  | 'timezone'
>;

const ALLOWED_UPDATE_KEYS = [
  'name', 'email', 'role', 'firstName', 'lastName', 'gender', 'address', 'age',
  'username', 'region', 'state', 'timezone', 'avatar',
  'companyId', 'locationId', 'teamId', 'securityRoleId', 'roleAssignments',
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    await connect();
    const isObjectId = mongoose.isValidObjectId(id);
    const profile = await UserModel.findOne(
      isObjectId ? { $or: [{ userId: id }, { _id: new mongoose.Types.ObjectId(id) }] } : { userId: id }
    ).lean() as ProfileDoc | null;
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = await profileToSafeUser(profile, { resolveAvatar: true });
    return NextResponse.json(user);
  } catch (e) {
    console.error('GET /api/admin/users/[id]:', e);
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
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_UPDATE_KEYS) {
      if (!(key in body)) continue;
      const v = body[key];
      if (key === 'roleAssignments') {
        if (!Array.isArray(v)) continue;
        updates[key] = v.map((a: { securityRoleId: string; companyId?: string | null; locationId?: string | null; teamId?: string | null; active?: boolean; overrides?: Record<string, unknown> }) => ({
          securityRoleId: mongoose.isValidObjectId(a.securityRoleId) ? new mongoose.Types.ObjectId(a.securityRoleId) : undefined,
          companyId: a.companyId && mongoose.isValidObjectId(a.companyId) ? new mongoose.Types.ObjectId(a.companyId) : null,
          locationId: a.locationId && mongoose.isValidObjectId(a.locationId) ? new mongoose.Types.ObjectId(a.locationId) : null,
          teamId: a.teamId && mongoose.isValidObjectId(a.teamId) ? new mongoose.Types.ObjectId(a.teamId) : null,
          active: a.active ?? true,
          overrides: a.overrides ?? undefined,
        })).filter((a: { securityRoleId: unknown }) => a.securityRoleId);
        continue;
      }
      if (['companyId', 'locationId', 'teamId', 'securityRoleId'].includes(key)) {
        if (v === null || v === undefined) updates[key] = null;
        else if (typeof v === 'string' && mongoose.isValidObjectId(v)) updates[key] = new mongoose.Types.ObjectId(v);
        continue;
      }
      if (key === 'age') {
        const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
        updates[key] = Number.isNaN(n) ? null : n;
        continue;
      }
      if (typeof v === 'string' || typeof v === 'number') {
        updates[key] = typeof v === 'string' ? (v.trim() || null) : v;
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    await connect();
    const isObjectId = mongoose.isValidObjectId(id);
    const profile = await UserModel.findOneAndUpdate(
      isObjectId ? { $or: [{ userId: id }, { _id: new mongoose.Types.ObjectId(id) }] } : { userId: id },
      { $set: updates },
      { new: true }
    ).lean() as ProfileDoc | null;
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = await profileToSafeUser(profile, { resolveAvatar: true });
    return NextResponse.json(user);
  } catch (e) {
    console.error('PATCH /api/admin/users/[id]:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
