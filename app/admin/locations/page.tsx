'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input, Table, Button } from '@/components/ui';
import styles from '../admin.module.scss';

type LocationRow = {
  id: string;
  name: string;
  code: string | null;
  status: string;
  companyId: string | null;
  companyName: string | null;
};

type Pagination = { page: number; limit: number; total: number; pages: number };

type CompanyOption = { id: string; name: string };

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/companies?limit=500')
      .then((res) => (res.ok ? res.json() : { companies: [] }))
      .then((data: { companies: CompanyOption[] }) => setCompanies(data.companies ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (companyFilter) params.set('companyId', companyFilter);
    fetch(`/api/admin/locations?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: { locations: LocationRow[]; pagination: Pagination }) => {
        setLocations(data.locations);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter, companyFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, companyFilter, search]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete location "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/locations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
        if (pagination) {
          setPagination((prev) =>
            prev ? { ...prev, total: Math.max(0, prev.total - 1) } : null
          );
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to delete');
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className={styles.formRow} style={{ maxWidth: 'none', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className={styles.pageTitle}>Locations</h1>
        <Link href="/admin/locations/new" className={styles.primaryLink}>
          New location
        </Link>
      </div>
      <p className={styles.pageDescription}>
        Manage locations. Optionally link to a company.
      </p>

      <div className={styles.formRow} style={{ maxWidth: 'none', gap: 'var(--unit-4)', marginBottom: 'var(--unit-6)' }}>
        <Input
          placeholder="Search by name, code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          style={{
            padding: 'var(--unit-2) var(--unit-3)',
            borderRadius: 'var(--unit-1)',
            border: '1px solid var(--theme-divider)',
          }}
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: 'var(--unit-2) var(--unit-3)',
            borderRadius: 'var(--unit-1)',
            border: '1px solid var(--theme-divider)',
          }}
        >
          <option value="">All statuses</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="archived">archived</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.pageDescription}>Loading…</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table<LocationRow>
              bordered
              data={locations}
              columns={[
                { key: 'name', header: 'Name', accessor: 'name' },
                { key: 'code', header: 'Code', render: (row) => row.code ?? '—' },
                { key: 'company', header: 'Company', render: (row) => row.companyName ?? '—' },
                { key: 'status', header: 'Status', accessor: 'status' },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <>
                      <Link href={`/admin/locations/${row.id}`} style={{ marginRight: 'var(--unit-2)' }}>
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
