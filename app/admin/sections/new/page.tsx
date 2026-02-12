'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import styles from '../../admin.module.scss';

const DEFAULT_ACTIONS = 'view, create, edit, delete, *';

function parseActions(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminSectionsNewPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [allowedActionsStr, setAllowedActionsStr] = useState(DEFAULT_ACTIONS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const allowedActions = parseActions(allowedActionsStr);
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          allowedActions: allowedActions.length > 0 ? allowedActions : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to create section');
      }
      const section = await res.json();
      router.push(`/admin/sections/${section.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>New section</h1>
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
              placeholder="section-id (lowercase, hyphens only)"
            />
            <Input
              label="Allowed actions (comma-separated)"
              value={allowedActionsStr}
              onChange={(e) => setAllowedActionsStr(e.target.value)}
              placeholder={DEFAULT_ACTIONS}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create section'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/sections')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
