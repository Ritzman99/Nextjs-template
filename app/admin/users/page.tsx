'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input, Table, Button } from '@/components/ui';
import styles from '../admin.module.scss';

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  securityRoleId: string | null;
  companyId: string | null;
  locationId: string | null;
  teamId: string | null;
};

type Pagination = { page: number; limit: number; total: number; pages: number };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    fetch(`/api/admin/users?${params}`)
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('Failed to load')))
      .then((data: { users: UserRow[]; pagination: Pagination }) => {
        setUsers(data.users);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, roleFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, search]);

  return (
    <div>
      <h1 className={styles.pageTitle}>Users</h1>
      <p className={styles.pageDescription}>
        Manage users, assign roles, and reset passwords.
      </p>

      <div className={styles.formRow} style={{ maxWidth: 'none', gap: 'var(--unit-4)', marginBottom: 'var(--unit-6)' }}>
        <Input
          placeholder="Search by email, name, username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: 'var(--unit-2) var(--unit-3)', borderRadius: 'var(--unit-1)', border: '1px solid var(--theme-divider)' }}
        >
          <option value="">All roles</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.pageDescription}>Loading…</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table<UserRow>
              bordered
              data={users}
              columns={[
                { key: 'email', header: 'Email', accessor: 'email' },
                { key: 'name', header: 'Name', render: (row) => row.name ?? '—' },
                { key: 'role', header: 'Role', accessor: 'role' },
                { key: 'securityRoleId', header: 'Security role', render: (row) => row.securityRoleId ?? '—' },
                { key: 'companyId', header: 'Company', render: (row) => row.companyId ?? '—' },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <Link href={`/admin/users/${row.id}`}>Edit</Link>
                  ),
                },
              ]}
            />
          </div>
          {pagination && pagination.pages > 1 && (
            <div className={styles.formActions} style={{ marginTop: 'var(--unit-4)' }}>
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span style={{ alignSelf: 'center' }}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
