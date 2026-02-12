'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input, Table, Button } from '@/components/ui';
import styles from '../admin.module.scss';

type TeamRow = {
  id: string;
  name: string;
  type: string | null;
  status: string;
  companyId: string | null;
  companyName: string | null;
  locationId: string | null;
  locationName: string | null;
};

type Pagination = { page: number; limit: number; total: number; pages: number };

type CompanyOption = { id: string; name: string };
type LocationOption = { id: string; name: string };

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/companies?limit=500')
      .then((res) => (res.ok ? res.json() : { companies: [] }))
      .then((data: { companies: CompanyOption[] }) => setCompanies(data.companies ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('limit', '500');
    if (companyFilter) params.set('companyId', companyFilter);
    fetch(`/api/admin/locations?${params}`)
      .then((res) => (res.ok ? res.json() : { locations: [] }))
      .then((data: { locations: LocationOption[] }) => setLocations(data.locations ?? []))
      .catch(() => setLocations([]));
    setLocationFilter('');
  }, [companyFilter]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (companyFilter) params.set('companyId', companyFilter);
    if (locationFilter) params.set('locationId', locationFilter);
    fetch(`/api/admin/teams?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: { teams: TeamRow[]; pagination: Pagination }) => {
        setTeams(data.teams);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter, companyFilter, locationFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, companyFilter, locationFilter, search]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete team "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/teams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTeams((prev) => prev.filter((t) => t.id !== id));
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
        <h1 className={styles.pageTitle}>Teams</h1>
        <Link href="/admin/teams/new" className={styles.primaryLink}>
          New team
        </Link>
      </div>
      <p className={styles.pageDescription}>
        Manage teams. Optionally link to a company and location.
      </p>

      <div className={styles.formRow} style={{ maxWidth: 'none', gap: 'var(--unit-4)', marginBottom: 'var(--unit-6)' }}>
        <Input
          placeholder="Search by name, type…"
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
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{
            padding: 'var(--unit-2) var(--unit-3)',
            borderRadius: 'var(--unit-1)',
            border: '1px solid var(--theme-divider)',
          }}
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
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
            <Table<TeamRow>
              bordered
              data={teams}
              columns={[
                { key: 'name', header: 'Name', accessor: 'name' },
                { key: 'type', header: 'Type', render: (row) => row.type ?? '—' },
                { key: 'company', header: 'Company', render: (row) => row.companyName ?? '—' },
                { key: 'location', header: 'Location', render: (row) => row.locationName ?? '—' },
                { key: 'status', header: 'Status', accessor: 'status' },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <>
                      <Link href={`/admin/teams/${row.id}`} style={{ marginRight: 'var(--unit-2)' }}>
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
