'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { RoleForm, getDefaultFormData, type RoleFormData } from '../RoleForm';
import styles from '../../admin.module.scss';

export default function AdminRoleEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const [initialData, setInitialData] = useState<RoleFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/roles/${id}`);
      if (res.status === 404) {
        if (!cancelled) setNotFound(true);
        return;
      }
      if (!res.ok) return;
      const role = await res.json();
      if (!cancelled) {
        setInitialData(getDefaultFormData({
          name: role.name,
          scopeLevel: role.scopeLevel,
          companyId: role.companyId ?? '',
          locationId: role.locationId ?? '',
          teamId: role.teamId ?? '',
          permissions: role.permissions ?? [],
        }));
      }
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(data: RoleFormData) {
    const res = await fetch(`/api/admin/roles/${id}`, {
      method: 'PATCH',
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
      throw new Error(err.error ?? 'Failed to update role');
    }
  }

  if (loading) return <p className={styles.pageDescription}>Loading…</p>;
  if (notFound || !initialData) {
    return (
      <div>
        <h1 className={styles.pageTitle}>Role not found</h1>
        <Link href="/admin/roles">← Back to roles</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Edit role</h1>
      <p className={styles.pageDescription}>
        <Link href="/admin/roles">← Back to roles</Link>
      </p>
      <RoleForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/roles')}
        submitLabel="Save"
      />
    </div>
  );
}
