'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Input, Select, Button, Checkbox } from '@/components/ui';
import type { User } from '@/types/user';
import type { RoleAssignment } from '@/types/user';
import styles from '../../admin.module.scss';

type RoleOption = { id: string; name: string };

export default function AdminUserEditPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const loadUser = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/admin/users/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data: User | null) => {
        if (data) setUser(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    fetch('/api/admin/roles')
      .then((res) => (res.ok ? res.json() : []))
      .then((list: { id: string; name: string }[]) => setRoles(list))
      .catch(() => {});
  }, []);

  function updateField<K extends keyof User>(key: K, value: User[K]) {
    setUser((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function updateRoleAssignment(index: number, patch: Partial<RoleAssignment>) {
    if (!user?.roleAssignments) return;
    const next = [...user.roleAssignments];
    next[index] = { ...next[index], ...patch };
    setUser((prev) => (prev ? { ...prev, roleAssignments: next } : null));
  }

  function addRoleAssignment() {
    setUser((prev) => (prev ? {
      ...prev,
      roleAssignments: [...(prev.roleAssignments ?? []), { securityRoleId: roles[0]?.id ?? '', active: true }],
    } : null));
  }

  function removeRoleAssignment(index: number) {
    setUser((prev) => (prev ? {
      ...prev,
      roleAssignments: prev.roleAssignments?.filter((_, i) => i !== index) ?? [],
    } : null));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          gender: user.gender,
          address: user.address,
          age: user.age,
          username: user.username,
          region: user.region,
          state: user.state,
          timezone: user.timezone,
          companyId: user.companyId || null,
          locationId: user.locationId || null,
          teamId: user.teamId || null,
          securityRoleId: user.securityRoleId || null,
          roleAssignments: user.roleAssignments?.map((a) => ({
            securityRoleId: a.securityRoleId,
            companyId: a.companyId || null,
            locationId: a.locationId || null,
            teamId: a.teamId || null,
            active: a.active ?? true,
            overrides: a.overrides,
          })) ?? [],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update');
      }
      const updated = await res.json();
      setUser(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to reset password');
        return;
      }
      setResetPasswordOpen(false);
      setNewPassword('');
    } finally {
      setResetting(false);
    }
  }

  if (loading) return <p className={styles.pageDescription}>Loading…</p>;
  if (notFound || !user) {
    return (
      <div>
        <h1 className={styles.pageTitle}>User not found</h1>
        <Link href="/admin/users">← Back to users</Link>
      </div>
    );
  }

  const roleOptions = [
    { value: 'user', label: 'user' },
    { value: 'admin', label: 'admin' },
  ];
  const securityRoleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <div>
      <h1 className={styles.pageTitle}>Edit user</h1>
      <p className={styles.pageDescription}>
        <Link href="/admin/users">← Back to users</Link>
      </p>

      {error && <p style={{ color: 'var(--theme-danger)', marginBottom: 'var(--unit-4)' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          <div className={styles.formRow}>
            <Input
              label="Email"
              type="email"
              value={user.email ?? ''}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />
            <Input
              label="Name"
              value={user.name ?? ''}
              onChange={(e) => updateField('name', e.target.value)}
            />
            <Select
              label="Role"
              options={roleOptions}
              value={user.role}
              onChange={(v) => updateField('role', v)}
            />
            <Select
              label="Security role"
              options={[{ value: '', label: '— None —' }, ...securityRoleOptions]}
              value={user.securityRoleId ?? ''}
              onChange={(v) => updateField('securityRoleId', v || null)}
            />
          </div>
          <div className={styles.formRow}>
            <Input label="First name" value={user.firstName ?? ''} onChange={(e) => updateField('firstName', e.target.value)} />
            <Input label="Last name" value={user.lastName ?? ''} onChange={(e) => updateField('lastName', e.target.value)} />
            <Input label="Username" value={user.username ?? ''} onChange={(e) => updateField('username', e.target.value)} />
            <Input label="Age" type="number" value={user.age ?? ''} onChange={(e) => { const n = parseInt(String(e.target.value), 10); updateField('age', Number.isNaN(n) ? null : n); }} />
          </div>
          <div className={styles.formRow}>
            <Input label="Company ID" value={user.companyId ?? ''} onChange={(e) => updateField('companyId', e.target.value || null)} />
            <Input label="Location ID" value={user.locationId ?? ''} onChange={(e) => updateField('locationId', e.target.value || null)} />
            <Input label="Team ID" value={user.teamId ?? ''} onChange={(e) => updateField('teamId', e.target.value || null)} />
          </div>
          <div className={styles.formRow}>
            <Input label="Address" value={user.address ?? ''} onChange={(e) => updateField('address', e.target.value)} />
            <Input label="Region" value={user.region ?? ''} onChange={(e) => updateField('region', e.target.value)} />
            <Input label="State" value={user.state ?? ''} onChange={(e) => updateField('state', e.target.value)} />
            <Input label="Timezone" value={user.timezone ?? ''} onChange={(e) => updateField('timezone', e.target.value)} />
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Role assignments</h2>
          {(user.roleAssignments ?? []).map((assignment, index) => (
            <div key={index} className={styles.permissionSection} style={{ marginBottom: 'var(--unit-3)' }}>
              <div className={styles.formRow} style={{ flexWrap: 'wrap', maxWidth: 'none' }}>
                <Select
                  label="Security role"
                  options={securityRoleOptions}
                  value={assignment.securityRoleId}
                  onChange={(v) => updateRoleAssignment(index, { securityRoleId: v })}
                />
                <Input
                  label="Company ID"
                  value={assignment.companyId ?? ''}
                  onChange={(e) => updateRoleAssignment(index, { companyId: e.target.value || null })}
                  placeholder="optional"
                />
                <Input
                  label="Location ID"
                  value={assignment.locationId ?? ''}
                  onChange={(e) => updateRoleAssignment(index, { locationId: e.target.value || null })}
                  placeholder="optional"
                />
                <Input
                  label="Team ID"
                  value={assignment.teamId ?? ''}
                  onChange={(e) => updateRoleAssignment(index, { teamId: e.target.value || null })}
                  placeholder="optional"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--unit-2)', paddingTop: 'var(--unit-8)' }}>
                  <Checkbox
                    checked={assignment.active ?? true}
                    onChange={(e) => updateRoleAssignment(index, { active: e.target.checked })}
                  />
                  Active
                </label>
                <Button type="button" variant="ghost" size="sm" color="danger" onClick={() => removeRoleAssignment(index)} style={{ alignSelf: 'flex-end' }}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addRoleAssignment}>
            Add assignment
          </Button>
        </div>

        <div className={styles.formActions}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setResetPasswordOpen(true)}>
            Reset password
          </Button>
        </div>
      </form>

      {resetPasswordOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !resetting && setResetPasswordOpen(false)}
        >
          <div
            style={{
              background: 'var(--theme-content1)',
              padding: 'var(--unit-6)',
              borderRadius: 'var(--unit-4)',
              minWidth: 320,
              border: '1px solid var(--theme-divider)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Reset password</h3>
            <form onSubmit={handleResetPassword}>
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 characters"
              />
              <div className={styles.formActions} style={{ marginTop: 'var(--unit-4)' }}>
                <Button type="submit" disabled={resetting || newPassword.length < 8}>
                  {resetting ? 'Resetting…' : 'Reset'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setResetPasswordOpen(false)} disabled={resetting}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
