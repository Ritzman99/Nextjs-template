'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RoleForm, getDefaultFormData } from '../RoleForm';
import styles from '../../admin.module.scss';

export default function AdminRolesNewPage() {
  const router = useRouter();

  async function handleSubmit(data: Parameters<Parameters<typeof RoleForm>[0]['onSubmit']>[0]) {
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        scopeLevel: data.scopeLevel,
        companyId: data.companyId || null,
        locationId: data.locationId || null,
        teamId: data.teamId || null,
        permissions: data.permissions,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to create role');
    }
    const role = await res.json();
    router.push(`/admin/roles/${role.id}`);
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>New role</h1>
      <p className={styles.pageDescription}>
        <Link href="/admin/roles">← Back to roles</Link>
      </p>
      <RoleForm
        initialData={getDefaultFormData()}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/roles')}
        submitLabel="Create role"
      />
    </div>
  );
}
