import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import UserContactModel, { type UserContactState } from '@/models/UserContact';
import UserModel from '@/models/User';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') as UserContactState | null;
    const q = searchParams.get('q') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

    await connect();

    const filter: Record<string, unknown> = { ownerId: userObjectId };
    if (state && ['default', 'friend', 'favoriteFriend'].includes(state)) {
      filter.state = state;
    }

    const searchTrim = q.trim();
    if (searchTrim) {
      const searchRegex = new RegExp(
        searchTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      const matchingUsers = await UserModel.find({
        $or: [
          { email: searchRegex },
          { username: searchRegex },
          { name: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      })
        .select('_id')
        .lean();
      const matchingIds = (matchingUsers as { _id: mongoose.Types.ObjectId }[]).map((x) => x._id);
      if (matchingIds.length === 0) {
        return NextResponse.json({
          contacts: [],
          pagination: { page, limit, total: 0, pages: 0 },
        });
      }
      (filter as { contactUserId: { $in: mongoose.Types.ObjectId[] } }).contactUserId = {
        $in: matchingIds,
      };
    }

    const total = await UserContactModel.countDocuments(filter);
    const contacts = await UserContactModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const contactUserIds = (contacts as unknown as { contactUserId: mongoose.Types.ObjectId }[]).map(
      (c) => c.contactUserId
    );
    if (contactUserIds.length === 0) {
      return NextResponse.json({
        contacts: [],
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    const users = await UserModel.find({ _id: { $in: contactUserIds } })
      .select('_id email name firstName lastName username')
      .lean();

    const userMap = new Map(
      (users as unknown as {
        _id: mongoose.Types.ObjectId;
        email: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        username?: string;
      }[]).map((u) => {
        const displayName =
          u.name?.trim() ||
          [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
          u.username ||
          u.email;
        return [
          u._id.toString(),
          {
            id: u._id.toString(),
            email: u.email,
            username: u.username ?? null,
            displayName,
          },
        ];
      })
    );

    const list = (contacts as unknown as { contactUserId: mongoose.Types.ObjectId; state: string }[]).map(
      (c) => {
        const u = userMap.get(c.contactUserId.toString());
        return {
          id: c.contactUserId.toString(),
          state: c.state as UserContactState,
          ...u,
        };
      }
    );

    return NextResponse.json({
      contacts: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('GET /api/contacts:', e);
    return NextResponse.json({ error: 'Failed to list contacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { identifier } = body as { identifier?: string };
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json({ error: 'identifier is required' }, { status: 400 });
    }

    const { resolveRecipient } = await import('@/lib/inboxResolver');
    const resolved = await resolveRecipient(identifier.trim());
    if (!resolved) {
      return NextResponse.json(
        { error: 'No user found with that email or username (exact match required)' },
        { status: 400 }
      );
    }
    if (resolved.type !== 'user') {
      return NextResponse.json(
        { error: 'Only users can be added as contacts (not system contacts)' },
        { status: 400 }
      );
    }

    const contactUserId = resolved.id;
    if (contactUserId.equals(userObjectId)) {
      return NextResponse.json({ error: 'You cannot add yourself as a contact' }, { status: 400 });
    }

    await connect();

    const existing = await UserContactModel.findOne({
      ownerId: userObjectId,
      contactUserId,
    }).lean();

    if (existing) {
      const ex = existing as unknown as { state: string };
      if (ex.state === 'friend' || ex.state === 'favoriteFriend') {
        return NextResponse.json({ error: 'Already friends with this user' }, { status: 400 });
      }
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
        state: ex.state,
        email: u?.email,
        username: u?.username ?? null,
        displayName,
      });
    }

    await UserContactModel.create({
      ownerId: userObjectId,
      contactUserId,
      state: 'default',
    });

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
      state: 'default',
      email: u?.email,
      username: u?.username ?? null,
      displayName,
    });
  } catch (e) {
    console.error('POST /api/contacts:', e);
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
  }
}
