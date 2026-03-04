'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RoleForm, getDefaultFormData } from '../RoleForm';
import styles from './new.module.scss';

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
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerAccent} aria-hidden />
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/admin/roles" className={styles.backLink}>
            <span aria-hidden>←</span>
            Back to roles
          </Link>
        </nav>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>New role</h1>
        </div>
        <p className={styles.subtitle}>
          Define a role with a name, scope, and permissions.
        </p>
      </header>

      <div className={styles.formCard}>
        <div className={styles.formCardBody}>
          <RoleForm
            initialData={getDefaultFormData()}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/roles')}
            submitLabel="Create role"
          />
        </div>
      </div>
    </div>
  );
}
