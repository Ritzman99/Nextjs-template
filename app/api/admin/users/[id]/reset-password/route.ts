import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { hash } from 'bcryptjs';
import connect from '@/lib/mongoose';
import UserModel from '@/models/User';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const body = await request.json();
    const { newPassword } = body as { newPassword?: string };
    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'newPassword is required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }
    await connect();
    const isObjectId = mongoose.isValidObjectId(id);
    const filter = isObjectId
      ? { $or: [{ userId: id }, { _id: new mongoose.Types.ObjectId(id) }] }
      : { userId: id };
    const hashedPassword = await hash(newPassword, 12);
    const doc = await UserModel.findOneAndUpdate(
      filter,
      { $set: { password: hashedPassword } },
      { new: true }
    );
    if (!doc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/admin/users/[id]/reset-password:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
