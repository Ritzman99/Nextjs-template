'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input, Table, Button } from '@/components/ui';
import { RequiresAdminFullAccess } from '@/components/admin/RequiresAdminFullAccess';
import styles from '../admin.module.scss';

type SectionRow = {
  id: string;
  name: string;
  slug: string;
  allowedActions: string[];
};

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/admin/sections?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: SectionRow[]) => setSections(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete section "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/sections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSections((prev) => prev.filter((s) => s.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to delete');
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleGenerateEnums() {
    setGenerateMessage(null);
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/sections/generate-enums', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setGenerateMessage('Generated lib/sections.ts successfully.');
      } else {
        setGenerateMessage(data.error ?? 'Failed to generate');
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className={styles.formRow} style={{ maxWidth: 'none', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className={styles.pageTitle}>Sections</h1>
        <Link href="/admin/sections/new" className={styles.primaryLink}>
          New section
        </Link>
      </div>
      <p className={styles.pageDescription}>
        Permission sections used for role-based access control. Create and edit sections here; use Generate Section Enums in development to update the code file.
      </p>

      <div className={styles.formRow} style={{ maxWidth: 'none', gap: 'var(--unit-4)', marginBottom: 'var(--unit-6)' }}>
        <Input
          placeholder="Search by name, slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
      </div>

      <RequiresAdminFullAccess>
        <div className={styles.formRow} style={{ maxWidth: 'none', gap: 'var(--unit-3)', marginBottom: 'var(--unit-6)', alignItems: 'center' }}>
          <Button
            variant="outline"
            disabled={generating}
            onClick={handleGenerateEnums}
          >
            {generating ? 'Generating…' : 'Generate Section Enums'}
          </Button>
          {generateMessage && (
            <span style={{ fontSize: '0.875rem', color: 'var(--theme-default-600)' }}>{generateMessage}</span>
          )}
          <span className={styles.pageDescription} style={{ margin: 0 }}>
            Dev only: overwrites lib/sections.ts from the database.
          </span>
        </div>
      </RequiresAdminFullAccess>

      {loading ? (
        <p className={styles.pageDescription}>Loading…</p>
      ) : (
        <div className={styles.tableWrap}>
          <Table<SectionRow>
            bordered
            data={sections}
            columns={[
              { key: 'name', header: 'Name', accessor: 'name' },
              { key: 'slug', header: 'Slug', render: (row) => <code style={{ fontSize: '0.875rem' }}>{row.slug}</code> },
              {
                key: 'allowedActions',
                header: 'Allowed actions',
                render: (row) => (row.allowedActions?.length ? row.allowedActions.join(', ') : '—'),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <>
                    <Link href={`/admin/sections/${row.id}`} style={{ marginRight: 'var(--unit-2)' }}>
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
      )}
    </div>
  );
}
