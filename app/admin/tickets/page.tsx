'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, Button } from '@/components/ui';
import styles from '../admin.module.scss';

type TicketRow = {
  id: string;
  subject: string;
  status: string;
  priority: string | null;
  requesterId: string | null;
  assigneeId: string | null;
  channel: string;
  updatedAt: string;
};

type Pagination = { page: number; limit: number; total: number; pages: number };

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/admin/tickets?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: { tickets: TicketRow[]; pagination: Pagination }) => {
        setTickets(data.tickets);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  return (
    <div>
      <h1 className={styles.pageTitle}>Tickets</h1>
      <p className={styles.pageDescription}>
        View and manage support tickets and email-level inbox.
      </p>

      <div className={styles.formRow} style={{ maxWidth: 'none', gap: 'var(--unit-4)', marginBottom: 'var(--unit-6)', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 'var(--unit-4)', alignItems: 'center' }}>
        <Link href="/admin/tickets/new" className={styles.primaryLink}>New ticket</Link>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 'var(--unit-2) var(--unit-3)', borderRadius: 'var(--unit-1)', border: '1px solid var(--theme-divider)' }}
        >
          <option value="">All statuses</option>
          <option value="open">open</option>
          <option value="pending">pending</option>
          <option value="resolved">resolved</option>
          <option value="closed">closed</option>
        </select>
        </div>
      </div>

      {loading ? (
        <p className={styles.pageDescription}>Loading…</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table<TicketRow>
              bordered
              data={tickets}
              columns={[
                { key: 'subject', header: 'Subject', accessor: 'subject' },
                { key: 'status', header: 'Status', accessor: 'status' },
                { key: 'priority', header: 'Priority', render: (row) => row.priority ?? '—' },
                { key: 'channel', header: 'Channel', accessor: 'channel' },
                { key: 'requesterId', header: 'Requester', render: (row) => row.requesterId ?? '—' },
                { key: 'assigneeId', header: 'Assignee', render: (row) => row.assigneeId ?? '—' },
                {
                  key: 'updatedAt',
                  header: 'Updated',
                  render: (row) => (row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '—'),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <Link href={`/admin/tickets/${row.id}`}>View</Link>
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
