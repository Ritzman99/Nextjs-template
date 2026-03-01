import mongoose from 'mongoose';
import connect from '@/lib/mongoose';
import UserModel from '@/models/User';
import ContactModel from '@/models/Contact';
import InboxMessageModel from '@/models/InboxMessage';
import UserContactModel from '@/models/UserContact';

export type ResolvedRecipient =
  | { type: 'user'; id: mongoose.Types.ObjectId }
  | { type: 'contact'; id: mongoose.Types.ObjectId };

export type SuggestionItem = {
  type: 'user' | 'contact';
  id: string;
  displayName: string;
  identifier: string;
  /** Set for user suggestions when they are in the current user's contacts. */
  contactState?: 'default' | 'friend' | 'favoriteFriend';
};

/**
 * Resolve a single identifier (username or email) to a User or system Contact.
 * Normalizes identifier to lowercase for comparison.
 * All users are valid recipients (role is not considered; admins can message and be messaged).
 */
export async function resolveRecipient(
  identifier: string
): Promise<ResolvedRecipient | null> {
  if (!identifier || typeof identifier !== 'string') return null;
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return null;

  await connect();

  const user = await UserModel.findOne({
    $or: [
      { email: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') } },
      { username: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') } },
    ],
  })
    .select('_id')
    .lean();

  if (user) {
    const u = user as { _id: mongoose.Types.ObjectId };
    return { type: 'user', id: u._id };
  }

  const contact = await ContactModel.findOne({
    type: 'system',
    identifier: normalized,
  })
    .select('_id')
    .lean();

  if (contact) {
    const c = contact as { _id: mongoose.Types.ObjectId };
    return { type: 'contact', id: c._id };
  }

  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get suggestions for compose: system contacts first, then recent participants
 * the current user has messaged. Optional query `q` filters by displayName/identifier.
 */
export async function getSuggestions(
  currentUserId: string,
  q?: string
): Promise<SuggestionItem[]> {
  await connect();

  const results: SuggestionItem[] = [];
  const seen = new Set<string>();

  const systemContacts = await ContactModel.find({ type: 'system' })
    .select('_id identifier displayName')
    .lean();

  const filter = q ? q.trim().toLowerCase() : '';
  for (const c of systemContacts) {
    const doc = c as unknown as { _id: mongoose.Types.ObjectId; identifier: string; displayName: string };
    const key = `contact:${doc._id.toString()}`;
    if (seen.has(key)) continue;
    if (filter && !doc.displayName.toLowerCase().includes(filter) && !doc.identifier.toLowerCase().includes(filter)) {
      continue;
    }
    seen.add(key);
    results.push({
      type: 'contact',
      id: doc._id.toString(),
      displayName: doc.displayName,
      identifier: doc.identifier,
    });
  }

  const userObjectId = await getUserObjectId(currentUserId);
  if (!userObjectId) return results;

  const recentMessageIds = await InboxMessageModel.find({
    $or: [{ fromRef: userObjectId }, { 'toRefs.ref': userObjectId }],
  })
    .select('fromRef fromType toRefs')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const recentRefs = new Map<string, { type: 'user' | 'contact'; ref: mongoose.Types.ObjectId }>();
  for (const msg of recentMessageIds) {
    const m = msg as unknown as {
      fromRef: mongoose.Types.ObjectId;
      fromType: string;
      toRefs: Array<{ type: string; ref: mongoose.Types.ObjectId }>;
    };
    if (!m.fromRef.equals(userObjectId)) {
      const k = `${m.fromType}:${m.fromRef.toString()}`;
      if (!recentRefs.has(k)) recentRefs.set(k, { type: m.fromType as 'user' | 'contact', ref: m.fromRef });
    }
    for (const t of m.toRefs || []) {
      if (!t.ref.equals(userObjectId)) {
        const k = `${t.type}:${t.ref.toString()}`;
        if (!recentRefs.has(k)) recentRefs.set(k, { type: t.type as 'user' | 'contact', ref: t.ref });
      }
    }
  }

  for (const { type, ref } of recentRefs.values()) {
    const key = `${type}:${ref.toString()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (type === 'contact') {
      const contact = await ContactModel.findById(ref).select('identifier displayName').lean();
      if (!contact) continue;
      const doc = contact as unknown as { identifier: string; displayName: string };
      if (filter && !doc.displayName.toLowerCase().includes(filter) && !doc.identifier.toLowerCase().includes(filter)) {
        continue;
      }
      results.push({
        type: 'contact',
        id: ref.toString(),
        displayName: doc.displayName,
        identifier: doc.identifier,
      });
    } else {
      const user = await UserModel.findById(ref)
        .select('email name firstName lastName username')
        .lean();
      if (!user) continue;
      const u = user as unknown as {
        email: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        username?: string;
      };
      const displayName =
        u.name?.trim() ||
        [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
        u.username ||
        u.email;
      const identifier = u.username || u.email;
      if (filter && !displayName.toLowerCase().includes(filter) && !identifier.toLowerCase().includes(filter)) {
        continue;
      }
      results.push({
        type: 'user',
        id: ref.toString(),
        displayName,
        identifier,
      });
    }
  }

  const userSuggestionIds = results
    .filter((r) => r.type === 'user')
    .map((r) => new mongoose.Types.ObjectId(r.id));
  if (userSuggestionIds.length > 0) {
    const contactLinks = await UserContactModel.find({
      ownerId: userObjectId,
      contactUserId: { $in: userSuggestionIds },
    })
      .select('contactUserId state')
      .lean();
    const stateByContactId = new Map(
      (contactLinks as unknown as { contactUserId: mongoose.Types.ObjectId; state: string }[]).map((c) => [
        c.contactUserId.toString(),
        c.state as 'default' | 'friend' | 'favoriteFriend',
      ])
    );
    for (const r of results) {
      if (r.type === 'user') {
        const state = stateByContactId.get(r.id);
        if (state) r.contactState = state;
      }
    }
  }

  return results;
}

/**
 * Resolve session user id (NextAuth) to User profile _id for Mongoose.
 * Tries _id, then userId, then (if sessionEmail provided) email match so admins
 * and other users are found even when session.id doesn't match profile.
 */
export async function getCurrentUserObjectId(
  sessionUserId: string,
  sessionEmail?: string | null
): Promise<mongoose.Types.ObjectId | null> {
  await connect();
  if (mongoose.isValidObjectId(sessionUserId)) {
    const u = await UserModel.findOne({ _id: new mongoose.Types.ObjectId(sessionUserId) })
      .select('_id')
      .lean();
    if (u) return (u as { _id: mongoose.Types.ObjectId })._id;
  }
  const byUserId = await UserModel.findOne({ userId: sessionUserId }).select('_id').lean();
  if (byUserId) return (byUserId as { _id: mongoose.Types.ObjectId })._id;
  if (sessionEmail && sessionEmail.trim()) {
    const normalized = sessionEmail.trim().toLowerCase();
    const byEmail = await UserModel.findOne({
      email: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') },
    })
      .select('_id')
      .lean();
    if (byEmail) return (byEmail as { _id: mongoose.Types.ObjectId })._id;
  }
  return null;
}

async function getUserObjectId(sessionUserId: string): Promise<mongoose.Types.ObjectId | null> {
  return getCurrentUserObjectId(sessionUserId);
}
