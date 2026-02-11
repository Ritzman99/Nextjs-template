import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import UserModel from '@/models/User';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body as { email?: string; password?: string; name?: string };

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    await connect();

    const existing = await UserModel.findOne({ email: trimmedEmail }).lean();
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const userId = new mongoose.Types.ObjectId().toString();
    const hashedPassword = await hash(password, 12);

    await UserModel.create({
      userId,
      email: trimmedEmail,
      password: hashedPassword,
      name: name?.trim() || undefined,
      role: 'user',
    });

    return NextResponse.json({ ok: true, message: 'Account created. You can sign in now.' });
  } catch (e) {
    console.error('Signup error:', e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
