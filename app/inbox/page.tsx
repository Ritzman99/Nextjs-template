'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList, InboxSidebarToggle } from '@/components/inbox';
import type { ConversationItem } from '@/components/inbox';
import { Input } from '@/components/ui';
import styles from './inbox.module.scss';

export default function InboxPage() {
  const searchParams = useSearchParams();
  const folder = searchParams?.get('folder') ?? 'inbox';
  const label = searchParams?.get('label') ?? '';
  const q = searchParams?.get('q') ?? '';

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('folder', folder);
    params.set('page', '1');
    params.set('limit', '20');
    if (label) params.set('label', label);
    if (q) params.set('q', q);
    try {
      const res = await fetch(`/api/inbox/conversations?${params}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setConversations(data.conversations ?? []);
      setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 });
    } catch {
      setConversations([]);
      setPagination((p) => ({ ...p, total: 0, pages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [folder, label, q]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const toolbarTitle =
    folder === 'inbox'
      ? 'Inbox'
      : folder === 'sent'
        ? 'Sent'
        : folder === 'starred'
          ? 'Starred'
          : folder === 'draft'
            ? 'Draft'
            : folder === 'trash'
              ? 'Trash'
              : 'Inbox';

  return (
    <>
      <div className={styles.toolbar}>
        <InboxSidebarToggle />
        <h1 className={styles.toolbarTitle}>{toolbarTitle}</h1>
        <div className={styles.searchInputWrap}>
          <Input
            type="search"
            placeholder="Search mail"
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim();
                const url = new URL(window.location.href);
                if (val) url.searchParams.set('q', val);
                else url.searchParams.delete('q');
                window.location.href = url.pathname + url.search;
              }
            }}
          />
        </div>
      </div>
      {loading ? (
        <div className={styles.emptyState}>Loading…</div>
      ) : (
        <ConversationList
          conversations={conversations}
          pagination={pagination}
          currentFolder={folder}
        />
      )}
    </>
  );
}
