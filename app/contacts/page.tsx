'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Card, Select, useToast } from '@/components/ui';
import { Users, ChevronDown } from 'lucide-react';
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

type FilterChip = '' | 'friend' | 'default' | 'favoriteFriend';
type SortOption = 'recent' | 'name';

const FILTER_CHIPS: { value: FilterChip; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'friend', label: 'Friends' },
  { value: 'default', label: 'Pending' },
  { value: 'favoriteFriend', label: 'Favorites' },
];

export default function ContactsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<FilterChip>('');
  const [search, setSearch] = useState('');
  const [addIdentifier, setAddIdentifier] = useState('');
  const [adding, setAdding] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [addPeopleOpen, setAddPeopleOpen] = useState(false);
  const [pendingRequestsOpen, setPendingRequestsOpen] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const addCardRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef(toast);
  toastRef.current = toast;

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
      toastRef.current.toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [stateFilter, search]);

  const fetchFriendRequestsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox/unread-count');
      if (!res.ok) return;
      const data = await res.json();
      setFriendRequestsCount(data.friendRequestsCount ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/contacts');
      return;
    }
    if (status === 'loading' || !session?.user) return;
    fetchContacts();
    fetchFriendRequestsCount();
  }, [status, session?.user, router, fetchContacts, fetchFriendRequestsCount]);

  const handleSendFriendRequest = async () => {
    const identifier = addIdentifier.trim();
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
      setAddIdentifier('');
      fetchFriendRequestsCount();
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

  const sortedContacts = useMemo(() => {
    const list = [...contacts];
    if (sortBy === 'name') {
      list.sort((a, b) => {
        const nameA = (a.displayName || a.email).toLowerCase();
        const nameB = (b.displayName || b.email).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
    return list;
  }, [contacts, sortBy]);

  const showEmptyState = !loading && sortedContacts.length === 0;
  const showFilters = search || stateFilter;

  if (status === 'loading' || !session?.user) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBlock}>
          <div className={styles.spinner} aria-hidden />
          <p className={styles.loadingText}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Contacts</h1>
          <p className={styles.pageDescription}>
            Manage your contacts and friend requests.
          </p>
        </div>
        <div className={styles.headerActions}>{/* Future buttons */}</div>
      </header>

      <div className={styles.grid}>
        <aside className={styles.leftColumn} ref={addCardRef}>
          <Card
            className={styles.card}
            header={
              <button
                type="button"
                className={styles.collapsibleHeader}
                onClick={() => setAddPeopleOpen((o) => !o)}
                aria-expanded={addPeopleOpen}
              >
                <span className={styles.collapsibleTitle}>Add people</span>
                <ChevronDown
                  className={addPeopleOpen ? styles.chevronOpen : styles.chevron}
                  size={20}
                  aria-hidden
                />
              </button>
            }
          >
            {addPeopleOpen && (
              <>
                <p className={styles.collapsibleDescription}>
                  Add by email or username. Send a friend request or add directly.
                </p>
                <div className={styles.addPeople}>
                  <Input
                    type="text"
                    placeholder="Email or username"
                    value={addIdentifier}
                    onChange={(e) => setAddIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
                    className={styles.addInput}
                  />
                  <div className={styles.addButtons}>
                    <Button
                      onClick={handleAddContact}
                      disabled={adding}
                      color="primary"
                      size="md"
                    >
                      {adding ? 'Adding…' : 'Add contact'}
                    </Button>
                    <Button
                      onClick={handleSendFriendRequest}
                      disabled={sendingRequest}
                      variant="outline"
                      color="secondary"
                      size="md"
                    >
                      {sendingRequest ? 'Sending…' : 'Send friend request'}
                    </Button>
                  </div>
                  <p className={styles.addHint}>
                    Requests appear in <Link href="/inbox?folder=friend_requests">Friend requests</Link>.
                  </p>
                </div>
              </>
            )}
          </Card>

          <Card
            className={styles.card}
            header={
              <button
                type="button"
                className={styles.collapsibleHeader}
                onClick={() => setPendingRequestsOpen((o) => !o)}
                aria-expanded={pendingRequestsOpen}
              >
                <span className={styles.collapsibleTitle}>Pending requests</span>
                {friendRequestsCount > 0 && (
                  <span className={styles.pendingBadge} aria-label={`${friendRequestsCount} pending`}>
                    {friendRequestsCount}
                  </span>
                )}
                <ChevronDown
                  className={pendingRequestsOpen ? styles.chevronOpen : styles.chevron}
                  size={20}
                  aria-hidden
                />
              </button>
            }
            footer={
              pendingRequestsOpen ? (
                <Link href="/inbox?folder=friend_requests">
                  <Button variant="outline" color="secondary" size="sm">
                    Open friend requests
                  </Button>
                </Link>
              ) : undefined
            }
          >
            {pendingRequestsOpen && (
              <p className={styles.pendingHint}>
                Friend requests you send or receive appear in your inbox. Accept or decline from there.
              </p>
            )}
          </Card>
        </aside>

        <main className={styles.rightColumn}>
          <div className={styles.chipsWrap}>
            {FILTER_CHIPS.map(({ value, label }) => (
              <button
                key={value || 'all'}
                type="button"
                className={stateFilter === value ? styles.chipSelected : styles.chip}
                onClick={() => setStateFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <Input
            type="search"
            placeholder="Search contacts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            aria-label="Search contacts"
          />

          <Card
            className={styles.card}
            header={
              <div className={styles.listHeader}>
                <h3 className={styles.listTitle}>Contacts list</h3>
                <div className={styles.sortWrap}>
                  <span className={styles.sortLabel}>Sort:</span>
                  <Select
                    options={[
                      { value: 'recent', label: 'Recently added' },
                      { value: 'name', label: 'Name' },
                    ]}
                    value={sortBy}
                    onChange={(v) => setSortBy(v as SortOption)}
                    placeholder="Sort"
                    className={styles.sortSelect}
                  />
                </div>
              </div>
            }
          >
            {loading ? (
              <div className={styles.loadingBlock}>
                <div className={styles.spinner} aria-hidden />
                <p className={styles.loadingText}>Loading contacts…</p>
              </div>
            ) : showEmptyState ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIllustration} aria-hidden>
                  <Users size={80} strokeWidth={1.25} opacity={0.5} />
                </div>
                <h4 className={styles.emptyTitle}>
                  {showFilters ? 'No contacts match' : 'No contacts yet'}
                </h4>
                <p className={styles.emptyDescription}>
                  {showFilters
                    ? 'Try changing your search or filter.'
                    : 'Add someone by email or username to get started.'}
                </p>
                <Button
                  color="primary"
                  size="md"
                  onClick={() => {
                    if (showFilters) {
                      setSearch('');
                      setStateFilter('');
                    } else {
                      addCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={styles.emptyCta}
                >
                  {showFilters ? 'Clear filters' : 'Add your first contact'}
                </Button>
              </div>
            ) : (
              <ul className={styles.contactList}>
                {sortedContacts.map((c) => (
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
                          {c.state === 'favoriteFriend' ? 'Favorite' : c.state === 'friend' ? 'Friend' : 'Pending'}
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
          </Card>

          {pagination.pages > 1 && (
            <p className={styles.pagination}>
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
