'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, Button, useToast } from '@/components/ui';
import styles from '../admin.module.scss';

/** Display name for the hardcoded system Admin role (bypasses all security). */
const ADMIN_ROLE_DISPLAY_NAME = 'Admin';

type RoleRow = {
  id: string;
  name: string;
  scopeLevel: string;
  permissionCount: number;
  isSystem?: boolean;
};

const ADMIN_SYSTEM_ROW: RoleRow = {
  id: '__admin__',
  name: ADMIN_ROLE_DISPLAY_NAME,
  scopeLevel: 'Global',
  permissionCount: 0,
  isSystem: true,
};

export default function AdminRolesPage() {
  const toast = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled) {
        setRoles([ADMIN_SYSTEM_ROW, ...data]);
      }
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string, name: string) {
    if (id === ADMIN_SYSTEM_ROW.id) return;
    if (!confirm(`Delete role "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
        toast.toast.success('Role deleted');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.toast.error(data.error ?? 'Failed to delete');
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p className={styles.pageDescription}>Loading roles…</p>;
  }

  return (
    <div>
      <div className={styles.pageHeaderRow}>
        <h1 className={styles.pageTitle}>Roles</h1>
        <Link href="/admin/roles/new" className={styles.primaryLink}>
          New role
        </Link>
      </div>
      <p className={styles.pageDescription}>
        Create and edit security roles and per-section permissions.
      </p>

      <div className={styles.tableWrap}>
        <Table<RoleRow>
          bordered
          data={roles}
          columns={[
            { key: 'name', header: 'Name', accessor: 'name' },
            { key: 'scopeLevel', header: 'Scope', accessor: 'scopeLevel' },
            {
              key: 'permissionCount',
              header: 'Permissions',
              render: (row) => (row.isSystem ? 'Full access' : row.permissionCount),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) =>
                row.isSystem ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--theme-default-600)' }}>System</span>
                ) : (
                  <>
                    <Link href={`/admin/roles/${row.id}`} style={{ marginRight: 'var(--unit-2)' }}>Edit</Link>
                    {' '}
                    <Button
                      variant="ghost"
                      size="sm"
                      color="danger"
                      disabled={deletingId === row.id}
                      onClick={() => handleDelete(row.id, row.name)}
                    >
                      {deletingId === row.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </>
                ),
            },
          ]}
        />
      </div>
    </div>
  );
}
