'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input, Table, Button, Select, useToast } from '@/components/ui';
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
  const toast = useToast();
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
        toast.toast.success('Location deleted');
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
        <h1 className={styles.pageTitle}>Locations</h1>
        <Link href="/admin/locations/new" className={styles.primaryLink}>
          New location
        </Link>
      </div>
      <p className={styles.pageDescription}>
        Manage locations. Optionally link to a company.
      </p>

      <div className={styles.filterRow}>
        <Input
          placeholder="Search by name, code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <Select
          options={[{ value: '', label: 'All companies' }, ...companies.map((c) => ({ value: c.id, label: c.name }))]}
          value={companyFilter}
          onChange={setCompanyFilter}
          placeholder="Company"
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
