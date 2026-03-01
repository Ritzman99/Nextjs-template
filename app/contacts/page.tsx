'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, useToast } from '@/components/ui';
import styles from './contacts.module.scss';

type ContactState = 'default' | 'friend' | 'favoriteFriend';

type ContactItem = {
  id: string;
  state: ContactState;
  displayName: string;
  email: string;
  username: string | null;
};

type Pagination = { page: number; limit: number; total: number; pages: number };

export default function ContactsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<ContactState | ''>('');
  const [search, setSearch] = useState('');
  const [addIdentifier, setAddIdentifier] = useState('');
  const [adding, setAdding] = useState(false);
  const [friendRequestId, setFriendRequestId] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '20');
    if (stateFilter) params.set('state', stateFilter);
    if (search.trim()) params.set('q', search.trim());
    try {
      const res = await fetch(`/api/contacts?${params}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 });
    } catch {
      setContacts([]);
      toast.toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [stateFilter, search]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/contacts');
      return;
    }
    if (status === 'loading' || !session?.user) return;
    fetchContacts();
  }, [status, session?.user, router, fetchContacts]);

  const handleSendFriendRequest = async () => {
    const identifier = friendRequestId.trim();
    if (!identifier) {
      toast.toast.error('Enter an email or username');
      return;
    }
    setSendingRequest(true);
    try {
      const res = await fetch('/api/inbox/friend-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.toast.error(data.error ?? 'Failed to send friend request');
        return;
      }
      toast.toast.success('Friend request sent');
      setFriendRequestId('');
      router.push(`/inbox?folder=friend_requests`);
    } catch {
      toast.toast.error('Failed to send friend request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAddContact = async () => {
    const identifier = addIdentifier.trim();
    if (!identifier) {
      toast.toast.error('Enter an email or username');
      return;
    }
    setAdding(true);
    try {
      const resolveRes = await fetch(
        `/api/inbox/contacts/resolve?identifier=${encodeURIComponent(identifier)}`
      );
      if (!resolveRes.ok) {
        toast.toast.error('Could not look up user');
        return;
      }
      const resolveData = await resolveRes.json();
      if (!resolveData.resolved || resolveData.resolved.type !== 'user') {
        toast.toast.error('No user found with that email or username (exact match required)');
        return;
      }
      const postRes = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const postData = await postRes.json();
      if (!postRes.ok) {
        toast.toast.error(postData.error ?? 'Failed to add contact');
        return;
      }
      toast.toast.success('Contact added');
      setAddIdentifier('');
      fetchContacts();
    } catch {
      toast.toast.error('Failed to add contact');
    } finally {
      setAdding(false);
    }
  };

  const handleSetFavorite = async (contactId: string) => {
    setUpdatingId(contactId);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'favoriteFriend' }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.toast.error(data.error ?? 'Failed to update');
        return;
      }
      toast.toast.success('Marked as favorite');
      fetchContacts();
    } catch {
      toast.toast.error('Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (contactId: string) => {
    if (!confirm('Remove this contact? If you are friends, this will unfriend both.')) return;
    setRemovingId(contactId);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.toast.error(data.error ?? 'Failed to remove');
        return;
      }
      toast.toast.success('Contact removed');
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
    } catch {
      toast.toast.error('Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  if (status === 'loading' || !session?.user) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Contacts</h1>
      <p className={styles.pageDescription}>
        Manage your contacts. Add users by exact email or username. Friend status is set when they
        accept your request from the inbox.
      </p>

      <div className={styles.addRow}>
        <Input
          type="text"
          placeholder="Email or username to add"
          value={addIdentifier}
          onChange={(e) => setAddIdentifier(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
          style={{ minWidth: 220 }}
        />
        <Button onClick={handleAddContact} disabled={adding}>
          {adding ? 'Adding…' : 'Add contact'}
        </Button>
      </div>
      <div className={styles.addRow}>
        <Input
          type="text"
          placeholder="Email or username to send friend request"
          value={friendRequestId}
          onChange={(e) => setFriendRequestId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendFriendRequest()}
          style={{ minWidth: 220 }}
        />
        <Button onClick={handleSendFriendRequest} disabled={sendingRequest}>
          {sendingRequest ? 'Sending…' : 'Send friend request'}
        </Button>
        <span className={styles.pageDescription} style={{ margin: 0, fontSize: '0.875rem' }}>
          Request will appear in their <Link href="/inbox?folder=friend_requests">Friend requests</Link>.
        </span>
      </div>

      <div className={styles.filterRow}>
        <Input
          type="search"
          placeholder="Search contacts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as ContactState | '')}
          style={{
            padding: 'var(--unit-2) var(--unit-3)',
            borderRadius: 'var(--unit-1)',
            border: '1px solid var(--theme-divider)',
            background: 'var(--theme-content1)',
          }}
        >
          <option value="">All</option>
          <option value="default">Default</option>
          <option value="friend">Friend</option>
          <option value="favoriteFriend">Favorite</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading contacts…</p>
      ) : contacts.length === 0 ? (
        <div className={styles.emptyState}>
          {search || stateFilter
            ? 'No contacts match your filters.'
            : 'No contacts yet. Add someone by email or username above.'}
        </div>
      ) : (
        <ul className={styles.contactList}>
          {contacts.map((c) => (
            <li key={c.id} className={styles.contactItem}>
              <div className={styles.contactInfo}>
                <p className={styles.contactName}>
                  <span
                    className={
                      c.state === 'favoriteFriend'
                        ? styles.badgeFavorite
                        : c.state === 'friend'
                          ? styles.badgeFriend
                          : styles.badgeDefault
                    }
                  >
                    {c.state === 'favoriteFriend' ? 'Favorite' : c.state === 'friend' ? 'Friend' : 'Default'}
                  </span>
                  {c.displayName || c.email}
                </p>
                <p className={styles.contactMeta}>
                  {c.email}
                  {c.username ? ` (@${c.username})` : ''}
                </p>
              </div>
              <div className={styles.actions}>
                {c.state === 'friend' && (
                  <Button
                    size="sm"
                    variant="outline"
                    color="secondary"
                    onClick={() => handleSetFavorite(c.id)}
                    disabled={updatingId === c.id}
                  >
                    {updatingId === c.id ? '…' : 'Set favorite'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(c.id)}
                  disabled={removingId === c.id}
                >
                  {removingId === c.id ? '…' : 'Remove'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pagination.pages > 1 && (
        <div className={styles.filterRow} style={{ marginTop: 'var(--unit-4)' }}>
          <span className={styles.pageDescription} style={{ margin: 0 }}>
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
        </div>
      )}
    </div>
  );
}
