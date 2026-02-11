import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hash, compare } from 'bcryptjs';
import connect from '@/lib/mongoose';
import UserModel from '@/models/User';
import { authOptions } from '@/lib/auth';

type ProfileWithPassword = { password?: string };

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (
      !currentPassword ||
      typeof currentPassword !== 'string' ||
      !newPassword ||
      typeof newPassword !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    await connect();
    const profile = (await UserModel.findOne({ userId: session.user.id }).lean()) as ProfileWithPassword | null;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const password = profile.password;
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'This account uses social login. Password change is not available.' },
        { status: 400 }
      );
    }

    const valid = await compare(currentPassword, password);
    if (!valid) {
      return NextResponse.json(
        { error: 'Current password is incorrect.' },
        { status: 401 }
      );
    }

    const hashedPassword = await hash(newPassword, 12);
    await UserModel.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { password: hashedPassword } }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/user/change-password:', e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
