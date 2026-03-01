'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input, Table, Button, Select, useToast } from '@/components/ui';
import styles from '../admin.module.scss';

type CompanyRow = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
};

type Pagination = { page: number; limit: number; total: number; pages: number };

export default function AdminCompaniesPage() {
  const toast = useToast();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/admin/companies?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: { companies: CompanyRow[]; pagination: Pagination }) => {
        setCompanies(data.companies);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete company "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCompanies((prev) => prev.filter((c) => c.id !== id));
        if (pagination) {
          setPagination((prev) =>
            prev ? { ...prev, total: Math.max(0, prev.total - 1) } : null
          );
        }
        toast.toast.success('Company deleted');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.toast.error(data.error ?? 'Failed to delete');
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className={styles.pageHeaderRow}>
        <h1 className={styles.pageTitle}>Companies</h1>
        <Link href="/admin/companies/new" className={styles.primaryLink}>
          New company
        </Link>
      </div>
      <p className={styles.pageDescription}>
        Manage companies.
      </p>

      <div className={styles.filterRow}>
        <Input
          placeholder="Search by name, slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <Select
          options={[
            { value: '', label: 'All statuses' },
            { value: 'active', label: 'active' },
            { value: 'inactive', label: 'inactive' },
            { value: 'archived', label: 'archived' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
        />
      </div>

      {loading ? (
        <p className={styles.pageDescription}>Loading…</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table<CompanyRow>
              bordered
              data={companies}
              columns={[
                { key: 'name', header: 'Name', accessor: 'name' },
                { key: 'slug', header: 'Slug', render: (row) => row.slug ?? '—' },
                { key: 'status', header: 'Status', accessor: 'status' },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <>
                      <Link href={`/admin/companies/${row.id}`} style={{ marginRight: 'var(--unit-2)' }}>
                        Edit
                      </Link>
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
          {pagination && pagination.pages > 1 && (
            <div className={styles.rowActions}>
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
