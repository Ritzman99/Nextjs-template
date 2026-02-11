import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connect from '@/lib/mongoose';
import UserModel from '@/models/User';
import { authOptions } from '@/lib/auth';
import { isS3Configured, getAvatarSignedUrl, deleteAvatar } from '@/lib/s3';
import type { User } from '@/types/user';
import type { IUser } from '@/models/User';

type ProfileDoc = Pick<IUser, 'userId' | 'email' | 'name' | 'image' | 'avatar' | 'avatarKey' | 'role' | 'firstName' | 'lastName' | 'gender' | 'address' | 'age' | 'username' | 'region' | 'state' | 'timezone'>;

async function profileToUser(doc: ProfileDoc): Promise<User> {
  const cdnUrl = process.env.NEXT_PUBLIC_AVATAR_CDN_URL;
  const avatar =
    doc.avatarKey && cdnUrl
      ? `${cdnUrl}/${doc.avatarKey}`
      : doc.avatarKey && isS3Configured()
        ? await getAvatarSignedUrl(doc.avatarKey, 3600)
        : doc.avatar ?? doc.image ?? null;
  return {
    id: doc.userId,
    name: doc.name ?? null,
    email: doc.email,
    role: doc.role ?? 'user',
    avatar,
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
    const user = await profileToUser(profile);
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
    const user = await profileToUser(profile);
    return NextResponse.json(user);
  } catch (e) {
    console.error('PATCH /api/user:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connect();
    const profile = await UserModel.findOne({ userId: session.user.id }).lean();
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const avatarKey = (profile as ProfileDoc).avatarKey;
    if (avatarKey && isS3Configured()) {
      try {
        await deleteAvatar(avatarKey);
      } catch (e) {
        console.warn('Failed to delete avatar from S3:', e);
      }
    }
    await UserModel.deleteOne({ userId: session.user.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/user:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
