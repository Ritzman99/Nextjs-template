import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connect from '@/lib/mongoose';
import UserModel from '@/models/User';
import { authOptions } from '@/lib/auth';
import { isS3Configured, deleteAvatar, getAvatarSignedUrl } from '@/lib/s3';
import type { User } from '@/types/user';
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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isS3Configured()) {
    return NextResponse.json(
      { error: 'File upload is not configured.' },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const { key } = body as { key?: string };
    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'key is required.' },
        { status: 400 }
      );
    }
    if (!key.startsWith(`avatars/${session.user.id}/`)) {
      return NextResponse.json(
        { error: 'Invalid avatar key.' },
        { status: 400 }
      );
    }

    await connect();
    const profile = (await UserModel.findOne({ userId: session.user.id }).lean()) as ProfileDoc | null;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const oldKey = profile.avatarKey;
    if (oldKey && oldKey !== key) {
      try {
        await deleteAvatar(oldKey);
      } catch (e) {
        console.warn('Failed to delete old avatar:', e);
      }
    }

    const updated = await UserModel.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { avatarKey: key }, $unset: { avatar: '' } },
      { new: true }
    ).lean() as ProfileDoc | null;

    if (!updated) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const user = await profileToUser(updated);
    return NextResponse.json(user);
  } catch (e) {
    console.error('POST /api/user/avatar/complete:', e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
