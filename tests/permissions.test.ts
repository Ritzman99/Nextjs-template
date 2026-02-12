import assert from 'node:assert/strict';
import test from 'node:test';
import { checkPermission, type SecurityRoleLike } from '../lib/permissions';

test('allows matching assignment and permission', () => {
  const rolesById = new Map<string, SecurityRoleLike>([
    [
      'role-owner',
      {
        id: 'role-owner',
        name: 'Owner',
        scopeLevel: 'company',
        permissions: [{ section: '*', actions: ['*'] }],
      },
    ],
  ]);

  const result = checkPermission({
    userId: 'user-1',
    scope: { companyId: 'company-1' },
    section: 'settings',
    action: 'edit',
    rolesById,
    assignments: [{ securityRoleId: 'role-owner', companyId: 'company-1', active: true }],
  });

  assert.equal(result.allowed, true);
});

test('rejects assignment outside scope hierarchy', () => {
  const rolesById = new Map<string, SecurityRoleLike>([
    [
      'role-teacher',
      {
        id: 'role-teacher',
        name: 'Teacher',
        scopeLevel: 'location',
        permissions: [{ section: 'classes', actions: ['view'] }],
      },
    ],
  ]);

  const result = checkPermission({
    userId: 'user-1',
    scope: { companyId: 'company-1', locationId: 'location-1' },
    section: 'classes',
    action: 'view',
    rolesById,
    assignments: [{ securityRoleId: 'role-teacher', locationId: 'location-2', active: true }],
  });

  assert.equal(result.allowed, false);
});

test('evaluates conditions with user and context data', () => {
  const rolesById = new Map<string, SecurityRoleLike>([
    [
      'role-student',
      {
        id: 'role-student',
        name: 'Student',
        scopeLevel: 'team',
        permissions: [
          {
            section: 'assignments',
            actions: ['submit'],
            conditions: [{ key: 'resourceOwnerId', operator: 'eq', value: '$userId' }],
          },
        ],
      },
    ],
  ]);

  const result = checkPermission({
    userId: 'user-123',
    scope: { teamId: 'team-1' },
    section: 'assignments',
    action: 'submit',
    rolesById,
    assignments: [{ securityRoleId: 'role-student', teamId: 'team-1', active: true }],
    context: { resourceOwnerId: 'user-123' },
  });

  assert.equal(result.allowed, true);
});
