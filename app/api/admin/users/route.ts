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

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const role = searchParams.get('role') ?? undefined;
    const companyId = searchParams.get('companyId') ?? undefined;
    const locationId = searchParams.get('locationId') ?? undefined;
    const teamId = searchParams.get('teamId') ?? undefined;
    const securityRoleId = searchParams.get('securityRoleId') ?? undefined;
    const search = searchParams.get('search')?.trim();

    await connect();
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (companyId && mongoose.isValidObjectId(companyId)) filter.companyId = new mongoose.Types.ObjectId(companyId);
    if (locationId && mongoose.isValidObjectId(locationId)) filter.locationId = new mongoose.Types.ObjectId(locationId);
    if (teamId && mongoose.isValidObjectId(teamId)) filter.teamId = new mongoose.Types.ObjectId(teamId);
    if (securityRoleId && mongoose.isValidObjectId(securityRoleId)) filter.securityRoleId = new mongoose.Types.ObjectId(securityRoleId);
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      UserModel.find(filter).lean().skip(skip).limit(limit).sort({ email: 1 }),
      UserModel.countDocuments(filter),
    ]);
    const profileDocs = docs as unknown as ProfileDoc[];

    const users = await Promise.all(profileDocs.map((doc) => profileToSafeUser(doc, { resolveAvatar: false })));

    return NextResponse.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('GET /api/admin/users:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
