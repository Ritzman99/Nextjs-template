import connect from '@/lib/mongoose';
import SecurityRoleModel from '@/models/SecurityRole';
import type { OrganizationMode } from '@/types/projectConfig';

const BASIC_ROLES = [
  { name: 'Admin', scopeLevel: 'global' as const, permissions: [{ section: '*', actions: ['*'] }] },
  { name: 'User', scopeLevel: 'team' as const, permissions: [{ section: '*', actions: ['view'] }] },
];

const EXTENDED_ROLES = [
  { name: 'Owner', scopeLevel: 'company' as const, permissions: [{ section: '*', actions: ['*'] }] },
  { name: 'Teacher', scopeLevel: 'location' as const, permissions: [
    { section: 'classes', actions: ['view', 'edit', 'grade'] },
    { section: 'students', actions: ['view'] },
  ]},
  { name: 'Student', scopeLevel: 'team' as const, permissions: [
    { section: 'classes', actions: ['view'] },
    { section: 'assignments', actions: ['submit'] },
  ]},
  { name: 'Admin', scopeLevel: 'global' as const, permissions: [{ section: '*', actions: ['*'] }] },
  { name: 'FreeUser', scopeLevel: 'team' as const, permissions: [
    { section: 'recipes', actions: ['view'] },
    { section: 'collections', actions: ['view'] },
  ]},
  { name: 'PremiumUser', scopeLevel: 'team' as const, permissions: [
    { section: 'recipes', actions: ['view', 'create', 'edit'] },
    { section: 'collections', actions: ['view', 'create', 'edit'] },
  ]},
  { name: 'AdminUser', scopeLevel: 'global' as const, permissions: [{ section: '*', actions: ['*'] }] },
  { name: 'ModeratorUser', scopeLevel: 'global' as const, permissions: [
    { section: 'recipes', actions: ['moderate', 'remove'] },
  ]},
  { name: 'PayrollUser', scopeLevel: 'global' as const, permissions: [
    { section: 'billing', actions: ['view', 'export'] },
  ]},
];

function normalizeScope(scope: string, org: OrganizationMode): 'global' | 'team' {
  if (org === 'teams-only') {
    return scope === 'global' ? 'global' : 'team';
  }
  return scope as 'global' | 'team';
}

export async function seedSetupRoles(
  preset: 'basic' | 'extended',
  organization: OrganizationMode
): Promise<{ created: number; updated: number }> {
  await connect();
  const roles = preset === 'basic' ? BASIC_ROLES : EXTENDED_ROLES;
  const normalized = roles.map((r) => ({
    name: r.name,
    scopeLevel: normalizeScope(r.scopeLevel, organization),
    permissions: r.permissions,
  }));

  let created = 0;
  let updated = 0;
  for (const role of normalized) {
    const existed = await SecurityRoleModel.exists({ name: role.name });
    await SecurityRoleModel.findOneAndUpdate(
      { name: role.name },
      { $set: { ...role, companyId: null, locationId: null, teamId: null } },
      { upsert: true, new: true }
    );
    if (!existed) created += 1;
    else updated += 1;
  }
  return { created, updated };
}
