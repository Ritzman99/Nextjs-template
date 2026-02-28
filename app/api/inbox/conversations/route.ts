import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connect from '@/lib/mongoose';
import { getCurrentUserObjectId } from '@/lib/inboxResolver';
import ConversationModel from '@/models/Conversation';
import InboxMessageModel from '@/models/InboxMessage';
import UserConversationStateModel, {
  type InboxFolder,
} from '@/models/UserConversationState';
import UserModel from '@/models/User';
import ContactModel from '@/models/Contact';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const userObjectId = await getCurrentUserObjectId(session.user.id);
    if (!userObjectId) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const folder = (searchParams.get('folder') as InboxFolder) || 'inbox';
    const label = searchParams.get('label') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const q = searchParams.get('q') ?? undefined;

    await connect();

    const stateFilter: Record<string, unknown> = {
      userId: userObjectId,
    };
    if (folder === 'starred') {
      stateFilter.starred = true;
    } else {
      stateFilter.folder = folder;
    }
    if (label) stateFilter.labels = label;

    const states = await UserConversationStateModel.find(stateFilter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('conversationId')
      .lean();

    const conversationIds = (states as unknown as { conversationId: { _id: mongoose.Types.ObjectId } }[])
      .map((s) => s.conversationId?._id)
      .filter(Boolean) as mongoose.Types.ObjectId[];

    if (conversationIds.length === 0) {
      return NextResponse.json({
        conversations: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
    }

    let convIdsForList = conversationIds;
    if (q && q.trim()) {
      const bySubject = await ConversationModel.find({
        _id: { $in: conversationIds },
        subject: new RegExp(escapeRegex(q.trim()), 'i'),
      })
        .select('_id')
        .lean();
      convIdsForList = (bySubject as unknown as { _id: mongoose.Types.ObjectId }[]).map((c) => c._id);
      if (convIdsForList.length === 0) {
        return NextResponse.json({
          conversations: [],
          pagination: { page, limit, total: 0, pages: 0 },
        });
      }
    }

    const convs = await ConversationModel.find({ _id: { $in: convIdsForList } })
      .lean()
      .then((list) => {
        const byId = new Map(list.map((c) => [(c as { _id: mongoose.Types.ObjectId })._id.toString(), c]));
        return convIdsForList.map((id) => byId.get(id.toString())).filter(Boolean) as unknown as { _id: mongoose.Types.ObjectId; type: string; subject?: string | null; updatedAt: Date }[];
      });

    const latestMessages = await InboxMessageModel.aggregate([
      { $match: { conversationId: { $in: convIdsForList } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$conversationId', first: { $first: '$$ROOT' } } },
    ]);

    const stateMap = new Map(
      (states as unknown as { conversationId: { _id: mongoose.Types.ObjectId }; folder?: string; readAt?: Date | null; starred?: boolean; labels?: string[] }[]).map(
        (s) => [s.conversationId?._id?.toString(), { folder: s.folder, readAt: s.readAt, starred: s.starred, labels: s.labels ?? [] }]
      )
    );
    const messageByConv = new Map(
      latestMessages.map((m: { _id: mongoose.Types.ObjectId; first: { fromType: string; fromRef: mongoose.Types.ObjectId; body: string; createdAt: Date } }) => [
        m._id.toString(),
        m.first,
      ])
    );

    const userIds = new Set<string>();
    const contactIds = new Set<string>();
    for (const m of latestMessages) {
      const first = (m as { first: { fromType: string; fromRef: mongoose.Types.ObjectId } }).first;
      if (first.fromType === 'user') userIds.add(first.fromRef.toString());
      else contactIds.add(first.fromRef.toString());
    }

    const users = await UserModel.find({ _id: { $in: Array.from(userIds).map((id) => new mongoose.Types.ObjectId(id)) } })
      .select('_id email name firstName lastName username')
      .lean();
    const userMap = new Map(
      (users as unknown as { _id: mongoose.Types.ObjectId; email: string; name?: string; firstName?: string; lastName?: string; username?: string }[]).map(
        (u) => [
          u._id.toString(),
          u.name?.trim() || [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username || u.email,
        ]
      )
    );
    const contacts = await ContactModel.find({ _id: { $in: Array.from(contactIds).map((id) => new mongoose.Types.ObjectId(id)) } })
      .select('_id displayName')
      .lean();
    const contactMap = new Map(
      (contacts as unknown as { _id: mongoose.Types.ObjectId; displayName: string }[]).map((c) => [c._id.toString(), c.displayName])
    );

    const conversations = convs.map((c) => {
      const cid = c._id.toString();
      const state = stateMap.get(cid);
      const msg = messageByConv.get(cid);
      let senderName = '';
      if (msg) {
        const fromRef = (msg as { fromRef: mongoose.Types.ObjectId; fromType: string }).fromRef?.toString();
        const fromType = (msg as { fromType: string }).fromType;
        senderName = fromType === 'user' ? (userMap.get(fromRef) ?? '') : (contactMap.get(fromRef) ?? '');
      }
      return {
        id: cid,
        type: c.type,
        subject: c.subject ?? '',
        updatedAt: c.updatedAt,
        folder: state?.folder ?? folder,
        readAt: state?.readAt ?? null,
        starred: state?.starred ?? false,
        labels: state?.labels ?? [],
        snippet: msg ? String((msg as { body: string }).body).slice(0, 80) : '',
        senderName,
      };
    });

    const total = await UserConversationStateModel.countDocuments(stateFilter);

    return NextResponse.json({
      conversations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('GET /api/inbox/conversations:', e);
    return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const userObjectId = await getCurrentUserObjectId(session.user.id);
    if (!userObjectId) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const body = await request.json();
    const {
      subject,
      body: messageBody,
      to,
      cc,
      bcc,
    } = body as {
      subject?: string;
      body?: string;
      to?: string[];
      cc?: string[];
      bcc?: string[];
    };

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: 'At least one recipient (to) is required' }, { status: 400 });
    }

    const { resolveRecipient } = await import('@/lib/inboxResolver');
    const toResolved: Array<{ type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }> = [];
    for (const identifier of to) {
      if (!identifier || typeof identifier !== 'string') continue;
      const r = await resolveRecipient(identifier);
      if (!r) {
        return NextResponse.json({ error: `Could not resolve recipient: ${identifier}` }, { status: 400 });
      }
      toResolved.push({ type: r.type, ref: r.id });
    }
    let ccResolved: Array<{ type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }> = [];
    if (cc && Array.isArray(cc)) {
      for (const identifier of cc) {
        if (!identifier || typeof identifier !== 'string') continue;
        const r = await resolveRecipient(identifier);
        if (r) ccResolved.push({ type: r.type, ref: r.id });
      }
    }
    let bccResolved: Array<{ type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }> = [];
    if (bcc && Array.isArray(bcc)) {
      for (const identifier of bcc) {
        if (!identifier || typeof identifier !== 'string') continue;
        const r = await resolveRecipient(identifier);
        if (r) bccResolved.push({ type: r.type, ref: r.id });
      }
    }

    await connect();

    const conversation = await ConversationModel.create({
      type: 'email',
      subject: typeof subject === 'string' ? subject.trim() || null : null,
    });

    const message = await InboxMessageModel.create({
      conversationId: conversation._id,
      fromType: 'user',
      fromRef: userObjectId,
      toRefs: toResolved,
      ccRefs: ccResolved.length ? ccResolved : undefined,
      bccRefs: bccResolved.length ? bccResolved : undefined,
      body: typeof messageBody === 'string' ? messageBody : '',
    });

    const now = new Date();
    const statesToCreate: Array<{ userId: mongoose.Types.ObjectId; conversationId: mongoose.Types.ObjectId; folder: InboxFolder; readAt: Date | null; starred: boolean; labels: never[] }> = [
      { userId: userObjectId, conversationId: conversation._id, folder: 'sent', readAt: now, starred: false, labels: [] },
    ];
    for (const t of toResolved) {
      if (t.type !== 'user') continue;
      statesToCreate.push({
        userId: t.ref,
        conversationId: conversation._id,
        folder: 'inbox',
        readAt: null,
        starred: false,
        labels: [],
      });
    }
    for (const t of ccResolved) {
      if (t.type !== 'user') continue;
      if (statesToCreate.some((s) => s.userId.equals(t.ref))) continue;
      statesToCreate.push({
        userId: t.ref,
        conversationId: conversation._id,
        folder: 'inbox',
        readAt: null,
        starred: false,
        labels: [],
      });
    }
    await UserConversationStateModel.insertMany(statesToCreate);

    return NextResponse.json({
      id: conversation._id.toString(),
      type: conversation.type,
      subject: conversation.subject ?? null,
      updatedAt: conversation.updatedAt,
      messageId: message._id.toString(),
    });
  } catch (e) {
    console.error('POST /api/inbox/conversations:', e);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
