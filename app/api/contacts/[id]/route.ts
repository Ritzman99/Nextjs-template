import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import UserContactModel, { type UserContactState } from '@/models/UserContact';
import UserModel from '@/models/User';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const userObjectId = await getCurrentUserObjectId(
      session.user.id,
      (session.user as { email?: string | null }).email
    );
    if (!userObjectId) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const { id: contactId } = await params;
    if (!contactId || !mongoose.isValidObjectId(contactId)) {
      return NextResponse.json({ error: 'Invalid contact id' }, { status: 400 });
    }
    const contactUserId = new mongoose.Types.ObjectId(contactId);

    const body = await request.json();
    const { state: newState } = body as { state?: UserContactState };
    if (!newState || !['default', 'friend', 'favoriteFriend'].includes(newState)) {
      return NextResponse.json({ error: 'Valid state is required (default, friend, favoriteFriend)' }, { status: 400 });
    }

    await connect();

    const link = await UserContactModel.findOne({
      ownerId: userObjectId,
      contactUserId,
    }).lean();
    if (!link) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    const currentState = (link as unknown as { state: string }).state;

    if (newState === 'favoriteFriend') {
      const otherSide = await UserContactModel.findOne({
        ownerId: contactUserId,
        contactUserId: userObjectId,
      }).lean();
      const otherState = otherSide ? (otherSide as unknown as { state: string }).state : null;
      if (otherState !== 'friend' && otherState !== 'favoriteFriend') {
        return NextResponse.json(
          { error: 'You can only set favorite for mutual friends' },
          { status: 400 }
        );
      }
    }

    if (newState === 'friend') {
      return NextResponse.json(
        { error: 'Friend state is set when the other user accepts your friend request' },
        { status: 400 }
      );
    }

    if (currentState === 'friend' || currentState === 'favoriteFriend') {
      const otherSide = await UserContactModel.findOne({
        ownerId: contactUserId,
        contactUserId: userObjectId,
      }).lean();
      if (otherSide && newState === 'default') {
        return NextResponse.json(
          { error: 'Use Remove friend to unfriend; cannot downgrade to default here' },
          { status: 400 }
        );
      }
    }

    await UserContactModel.updateOne(
      { ownerId: userObjectId, contactUserId },
      { $set: { state: newState } }
    );

    const user = await UserModel.findById(contactUserId)
      .select('_id email name firstName lastName username')
      .lean();
    const u = user as unknown as {
      _id: mongoose.Types.ObjectId;
      email: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
    };
    const displayName =
      u?.name?.trim() ||
      [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim() ||
      u?.username ||
      u?.email ||
      '';

    return NextResponse.json({
      id: contactUserId.toString(),
      state: newState,
      email: u?.email,
      username: u?.username ?? null,
      displayName,
    });
  } catch (e) {
    console.error('PATCH /api/contacts/[id]:', e);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const userObjectId = await getCurrentUserObjectId(
      session.user.id,
      (session.user as { email?: string | null }).email
    );
    if (!userObjectId) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const { id: contactId } = await params;
    if (!contactId || !mongoose.isValidObjectId(contactId)) {
      return NextResponse.json({ error: 'Invalid contact id' }, { status: 400 });
    }
    const contactUserId = new mongoose.Types.ObjectId(contactId);

    await connect();

    const link = await UserContactModel.findOne({
      ownerId: userObjectId,
      contactUserId,
    }).lean();
    if (!link) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    const state = (link as unknown as { state: string }).state;

    await UserContactModel.deleteOne({ ownerId: userObjectId, contactUserId });

    if (state === 'friend' || state === 'favoriteFriend') {
      await UserContactModel.deleteOne({
        ownerId: contactUserId,
        contactUserId: userObjectId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/contacts/[id]:', e);
    return NextResponse.json({ error: 'Failed to remove contact' }, { status: 500 });
  }
}
