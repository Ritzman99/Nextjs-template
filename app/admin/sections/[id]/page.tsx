'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import styles from '../../admin.module.scss';

function parseActions(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminSectionEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [allowedActionsStr, setAllowedActionsStr] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/admin/sections/${id}`)
      .then((res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then(
        (data: { name: string; slug: string; allowedActions: string[] } | null) => {
          if (data && !cancelled) {
            setName(data.name);
            setSlug(data.slug);
            setAllowedActionsStr(Array.isArray(data.allowedActions) ? data.allowedActions.join(', ') : '');
          }
        }
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const allowedActions = parseActions(allowedActionsStr);
      const res = await fetch(`/api/admin/sections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          allowedActions,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update section');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this section? Roles that reference it must be updated first.')) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/sections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/sections');
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <p className={styles.pageDescription}>Loading…</p>;
  if (notFound) {
    return (
      <div>
        <h1 className={styles.pageTitle}>Section not found</h1>
        <Link href="/admin/sections">← Back to sections</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Edit section</h1>
      <p className={styles.pageDescription}>
        <Link href="/admin/sections">← Back to sections</Link>
      </p>

      {error && (
        <p style={{ color: 'var(--theme-danger)', marginBottom: 'var(--unit-4)' }}>{error}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Details</h2>
          <div className={styles.formRow}>
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Section display name"
            />
            <Input
              label="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="section-id"
            />
            <Input
              label="Allowed actions (comma-separated)"
              value={allowedActionsStr}
              onChange={(e) => setAllowedActionsStr(e.target.value)}
              placeholder="view, create, edit, delete, *"
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/sections')}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="ghost"
            color="danger"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </form>
    </div>
  );
}
