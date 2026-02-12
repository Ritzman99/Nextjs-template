'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input, Select, Button } from '@/components/ui';
import styles from '../../admin.module.scss';

const STATUS_OPTIONS = [
  { value: 'active', label: 'active' },
  { value: 'inactive', label: 'inactive' },
  { value: 'archived', label: 'archived' },
];

type CompanyOption = { id: string; name: string };
type LocationOption = { id: string; name: string };

export default function AdminTeamsNewPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/companies?limit=500')
      .then((res) => (res.ok ? res.json() : { companies: [] }))
      .then((data: { companies: CompanyOption[] }) => setCompanies(data.companies ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    fetch(`/api/admin/locations?${params}&limit=500`)
      .then((res) => (res.ok ? res.json() : { locations: [] }))
      .then((data: { locations: LocationOption[] }) => setLocations(data.locations ?? []))
      .catch(() => setLocations([]));
    setLocationId('');
  }, [companyId]);

  const companyOptions = [
    { value: '', label: '— None —' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];
  const locationOptions = [
    { value: '', label: '— None —' },
    ...locations.map((l) => ({ value: l.id, label: l.name })),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId || null,
          locationId: locationId || null,
          name: name.trim(),
          type: type.trim() || undefined,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to create team');
      }
      const team = await res.json();
      router.push(`/admin/teams/${team.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>New team</h1>
      <p className={styles.pageDescription}>
        <Link href="/admin/teams">← Back to teams</Link>
      </p>

      {error && (
        <p style={{ color: 'var(--theme-danger)', marginBottom: 'var(--unit-4)' }}>{error}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Details</h2>
          <div className={styles.formRow}>
            <Select
              label="Company"
              options={companyOptions}
              value={companyId}
              onChange={(v) => setCompanyId(v)}
            />
            <Select
              label="Location"
              options={locationOptions}
              value={locationId}
              onChange={(v) => setLocationId(v)}
            />
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Team name"
            />
            <Input
              label="Type (optional)"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. Sales, Support"
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => setStatus(v)}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create team'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/teams')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
