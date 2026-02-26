import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import connect from '@/lib/mongoose';
import UserModel from '@/models/User';
import SecurityRoleModel from '@/models/SecurityRole';
import { checkPermission, type RoleAssignmentLike, type SecurityRoleLike } from '@/lib/permissions';
import type { SectionId } from '@/lib/sections';
import { ADMIN_ROLE } from '@/lib/adminConstants';

export { ADMIN_ROLE };

export async function requireAdmin(): Promise<
  | { session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const role = (session.user as { role?: string }).role;
  if (role !== ADMIN_ROLE) {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session, error: null };
}

export type RequireSectionAccessResult =
  | { session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>; error: null }
  | { session: null; error: NextResponse };

/**
 * Requires the user to be logged in and either have the Admin role (bypass) or
 * have section permission for the given action. Use in admin API routes.
 */
export async function requireSectionAccess(
  sectionId: SectionId,
  action: string
): Promise<RequireSectionAccessResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const role = (session.user as { role?: string }).role;
  if (role === ADMIN_ROLE) {
    return { session, error: null };
  }

  await connect();
  const profile = await UserModel.findOne({ userId: session.user.id })
    .select('roleAssignments securityRoleId')
    .lean();
  if (!profile) {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const assignments: RoleAssignmentLike[] = [];
  const roleIds = new Set<string>();

  const rawAssignments = (profile as { roleAssignments?: Array<{
    securityRoleId: { toString(): string };
    companyId?: { toString(): string } | null;
    locationId?: { toString(): string } | null;
    teamId?: { toString(): string } | null;
    active?: boolean;
  }> }).roleAssignments ?? [];
  for (const a of rawAssignments) {
    const sid = a.securityRoleId?.toString();
    if (sid) {
      roleIds.add(sid);
      assignments.push({
        securityRoleId: sid,
        companyId: a.companyId?.toString() ?? null,
        locationId: a.locationId?.toString() ?? null,
        teamId: (a as { teamId?: { toString(): string } | null }).teamId?.toString() ?? null,
        active: a.active !== false,
      });
    }
  }

  const defaultRoleId = (profile as { securityRoleId?: { toString(): string } | null }).securityRoleId?.toString();
  if (defaultRoleId) {
    roleIds.add(defaultRoleId);
    assignments.push({
      securityRoleId: defaultRoleId,
      companyId: null,
      locationId: null,
      teamId: null,
      active: true,
    });
  }

  if (roleIds.size === 0) {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const objectIds = Array.from(roleIds)
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const roleDocs = await SecurityRoleModel.find({ _id: { $in: objectIds } }).lean();
  const rolesById = new Map<string, SecurityRoleLike>();
  for (const r of roleDocs) {
    const id = (r as { _id: { toString(): string } })._id.toString();
    rolesById.set(id, {
      id,
      name: r.name,
      scopeLevel: r.scopeLevel,
      permissions: r.permissions ?? [],
    });
  }

  const scope = {
    companyId: (session.user as { companyId?: string | null }).companyId ?? null,
    locationId: (session.user as { locationId?: string | null }).locationId ?? null,
    teamId: (session.user as { teamId?: string | null }).teamId ?? null,
  };

  const decision = checkPermission({
    userId: session.user.id,
    scope,
    section: sectionId,
    action,
    rolesById,
    assignments,
  });

  if (!decision.allowed) {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session, error: null };
}
