export type ScopeLevel = 'global' | 'company' | 'location' | 'team';

export interface PermissionCondition {
  key: string;
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'contains' | 'exists' | 'truthy';
  value?: unknown;
}

export interface RolePermission {
  section: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

export interface SecurityRoleLike {
  id?: string;
  _id?: string;
  name: string;
  scopeLevel: ScopeLevel;
  permissions: RolePermission[];
}

export interface RoleAssignmentLike {
  securityRoleId: string;
  companyId?: string | null;
  locationId?: string | null;
  teamId?: string | null;
  active?: boolean;
  overrides?: {
    permissions?: RolePermission[];
  };
}

export interface PermissionContext {
  resourceOwnerId?: string | null;
  attributes?: Record<string, unknown>;
  now?: Date;
}

export interface PermissionCheckInput {
  userId: string;
  scope: {
    companyId?: string | null;
    locationId?: string | null;
    teamId?: string | null;
  };
  section: string;
  action: string;
  rolesById: Map<string, SecurityRoleLike>;
  assignments: RoleAssignmentLike[];
  context?: PermissionContext;
  conditionResolvers?: Record<
    string,
    (condition: PermissionCondition, context: PermissionContext & { userId: string }) => boolean
  >;
}

export interface PermissionDecision {
  allowed: boolean;
  matchedRoleIds: string[];
  matchedAssignments: RoleAssignmentLike[];
}

function getScopeLevel(scope: PermissionCheckInput['scope']): ScopeLevel {
  if (scope.teamId) return 'team';
  if (scope.locationId) return 'location';
  if (scope.companyId) return 'company';
  return 'global';
}

function matchesScope(assignment: RoleAssignmentLike, scope: PermissionCheckInput['scope']): boolean {
  const scopeLevel = getScopeLevel(scope);
  if (scopeLevel === 'global') {
    return !assignment.companyId && !assignment.locationId && !assignment.teamId;
  }

  if (assignment.teamId) {
    return scope.teamId === assignment.teamId;
  }

  if (assignment.locationId) {
    return scope.locationId === assignment.locationId;
  }

  if (assignment.companyId) {
    return scope.companyId === assignment.companyId;
  }

  return true;
}

function isActionMatch(actions: string[], action: string): boolean {
  return actions.includes(action) || actions.includes('*');
}

function isSectionMatch(section: string, targetSection: string): boolean {
  return section === targetSection || section === '*';
}

function resolveValue(
  value: unknown,
  context: PermissionContext & { userId: string }
): unknown {
  if (value === '$userId') return context.userId;
  if (value === '$resourceOwnerId') return context.resourceOwnerId ?? null;
  return value;
}

function getContextValue(
  key: string,
  context: PermissionContext & { userId: string }
): unknown {
  if (key in context) return (context as unknown as Record<string, unknown>)[key];
  return context.attributes?.[key];
}

function evaluateCondition(
  condition: PermissionCondition,
  context: PermissionContext & { userId: string },
  conditionResolvers?: PermissionCheckInput['conditionResolvers']
): boolean {
  if (conditionResolvers?.[condition.key]) {
    return conditionResolvers[condition.key](condition, context);
  }

  const left = getContextValue(condition.key, context);
  const right = resolveValue(condition.value, context);

  switch (condition.operator) {
    case 'exists':
      return left !== undefined && left !== null;
    case 'truthy':
      return Boolean(left);
    case 'eq':
      return left === right;
    case 'neq':
      return left !== right;
    case 'in':
      return Array.isArray(right) ? right.includes(left) : false;
    case 'nin':
      return Array.isArray(right) ? !right.includes(left) : false;
    case 'contains':
      return Array.isArray(left) ? left.includes(right) : false;
    default:
      return false;
  }
}

function conditionsPass(
  conditions: PermissionCondition[] | undefined,
  context: PermissionContext & { userId: string },
  conditionResolvers?: PermissionCheckInput['conditionResolvers']
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((condition) => evaluateCondition(condition, context, conditionResolvers));
}

export function checkPermission(input: PermissionCheckInput): PermissionDecision {
  const matchedRoleIds: string[] = [];
  const matchedAssignments: RoleAssignmentLike[] = [];
  const context: PermissionContext & { userId: string } = {
    ...(input.context ?? {}),
    userId: input.userId,
  };

  const relevantAssignments = input.assignments.filter(
    (assignment) => assignment.active !== false && matchesScope(assignment, input.scope)
  );

  for (const assignment of relevantAssignments) {
    const roleId = assignment.securityRoleId;
    const role = input.rolesById.get(roleId);
    if (!role) continue;
    const permissions = assignment.overrides?.permissions ?? role.permissions;

    for (const permission of permissions) {
      if (!isSectionMatch(permission.section, input.section)) continue;
      if (!isActionMatch(permission.actions, input.action)) continue;
      if (!conditionsPass(permission.conditions, context, input.conditionResolvers)) continue;

      matchedRoleIds.push(roleId);
      matchedAssignments.push(assignment);
      return { allowed: true, matchedRoleIds, matchedAssignments };
    }
  }

  return { allowed: false, matchedRoleIds, matchedAssignments };
}
