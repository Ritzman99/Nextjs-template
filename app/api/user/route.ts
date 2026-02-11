import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connect from '@/lib/mongoose';
import UserModel from '@/models/User';
import { authOptions } from '@/lib/auth';
import type { User } from '@/types/user';
import type { IUser } from '@/models/User';

type ProfileDoc = Pick<IUser, 'userId' | 'email' | 'name' | 'image' | 'avatar' | 'role' | 'firstName' | 'lastName' | 'gender' | 'address' | 'age' | 'username' | 'region' | 'state' | 'timezone'>;

function profileToUser(doc: ProfileDoc): User {
  return {
    id: doc.userId,
    name: doc.name ?? null,
    email: doc.email,
    role: doc.role ?? 'user',
    avatar: doc.avatar ?? doc.image ?? null,
    firstName: doc.firstName ?? null,
    lastName: doc.lastName ?? null,
    gender: doc.gender ?? null,
    address: doc.address ?? null,
    age: doc.age ?? null,
    username: doc.username ?? null,
    region: doc.region ?? null,
    state: doc.state ?? null,
    timezone: doc.timezone ?? null,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connect();
    const profile = await UserModel.findOne({ userId: session.user.id }).lean() as ProfileDoc | null;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const user = profileToUser(profile);
    return NextResponse.json(user);
  } catch (e) {
    console.error('GET /api/user:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

const ALLOWED_KEYS = [
  'firstName',
  'lastName',
  'gender',
  'address',
  'age',
  'username',
  'region',
  'state',
  'timezone',
  'avatar',
  'name',
  'email',
] as const;

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_KEYS) {
      if (!(key in body)) continue;
      const v = body[key];
      if (v === null || v === undefined) {
        updates[key] = null;
      } else if (key === 'age') {
        const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
        updates[key] = Number.isNaN(n) ? null : n;
      } else if (typeof v === 'string' || typeof v === 'number') {
        updates[key] = typeof v === 'string' ? (v.trim() || null) : v;
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    await connect();
    const profile = await UserModel.findOneAndUpdate(
      { userId: session.user.id },
      { $set: updates },
      { new: true }
    ).lean() as ProfileDoc | null;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const user = profileToUser(profile);
    return NextResponse.json(user);
  } catch (e) {
    console.error('PATCH /api/user:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
