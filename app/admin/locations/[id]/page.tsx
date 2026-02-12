'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Input, Select, Button } from '@/components/ui';
import styles from '../../admin.module.scss';

const STATUS_OPTIONS = [
  { value: 'active', label: 'active' },
  { value: 'inactive', label: 'inactive' },
  { value: 'archived', label: 'archived' },
];

type CompanyOption = { id: string; name: string };

export default function AdminLocationEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/companies?limit=500')
      .then((res) => (res.ok ? res.json() : { companies: [] }))
      .then((data: { companies: CompanyOption[] }) => setCompanies(data.companies ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/admin/locations/${id}`)
      .then((res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data: { companyId: string | null; name: string; code: string | null; status: string } | null) => {
        if (data && !cancelled) {
          setCompanyId(data.companyId ?? '');
          setName(data.name);
          setCode(data.code ?? '');
          setStatus(data.status ?? 'active');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const companyOptions = [
    { value: '', label: '— None —' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId || null,
          name: name.trim(),
          code: code.trim() || null,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update location');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className={styles.pageDescription}>Loading…</p>;
  if (notFound) {
    return (
      <div>
        <h1 className={styles.pageTitle}>Location not found</h1>
        <Link href="/admin/locations">← Back to locations</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Edit location</h1>
      <p className={styles.pageDescription}>
        <Link href="/admin/locations">← Back to locations</Link>
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
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Location name"
            />
            <Input
              label="Code (optional)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. WH-01"
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
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/locations')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
