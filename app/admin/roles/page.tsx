'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, Button } from '@/components/ui';
import styles from '../admin.module.scss';

type RoleRow = {
  id: string;
  name: string;
  scopeLevel: string;
  permissionCount: number;
};

export default function AdminRolesPage() {
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
        setRoles(data);
      }
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete role "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to delete');
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
      <div className={styles.formRow} style={{ maxWidth: 'none', justifyContent: 'space-between', alignItems: 'center' }}>
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
            { key: 'permissionCount', header: 'Permissions', accessor: 'permissionCount' },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
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
