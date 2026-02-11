'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { User } from '@/types/user';
import styles from './profile.module.scss';

const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/profile');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    fetch('/api/user')
      .then((res) => {
        if (res.status === 401) {
          router.replace('/auth/signin?callbackUrl=/profile');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data && !data.error) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || saving) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          gender: user.gender ?? '',
          email: user.email ?? '',
          address: user.address ?? '',
          age: user.age ?? '',
          username: user.username ?? '',
          region: user.region ?? '',
          state: user.state ?? '',
          timezone: user.timezone ?? '',
          avatar: user.avatar ?? '',
          name: user.name ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data.error as string) ?? 'Failed to update profile.');
        setSaving(false);
        return;
      }
      setUser(data);
    } catch {
      setError('Something went wrong.');
    }
    setSaving(false);
  }

  if (status === 'loading' || loading) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (!session?.user || !user) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Profile</h1>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <Input
              label="First name"
              value={user.firstName ?? ''}
              onChange={(e) => setUser((u) => (u ? { ...u, firstName: e.target.value } : u))}
              disabled={saving}
            />
            <Input
              label="Last name"
              value={user.lastName ?? ''}
              onChange={(e) => setUser((u) => (u ? { ...u, lastName: e.target.value } : u))}
              disabled={saving}
            />
          </div>
          <Input
            label="Display name"
            value={user.name ?? ''}
            onChange={(e) => setUser((u) => (u ? { ...u, name: e.target.value } : u))}
            disabled={saving}
          />
          <Input
            label="Email"
            type="email"
            value={user.email ?? ''}
            onChange={(e) => setUser((u) => (u ? { ...u, email: e.target.value } : u))}
            disabled={saving}
          />
          <Select
            label="Gender"
            options={GENDER_OPTIONS}
            value={user.gender ?? ''}
            onChange={(value) => setUser((u) => (u ? { ...u, gender: value || null } : u))}
            disabled={saving}
          />
          <Input
            label="Username"
            value={user.username ?? ''}
            onChange={(e) => setUser((u) => (u ? { ...u, username: e.target.value } : u))}
            disabled={saving}
          />
          <Input
            label="Address"
            value={user.address ?? ''}
            onChange={(e) => setUser((u) => (u ? { ...u, address: e.target.value } : u))}
            disabled={saving}
          />
          <div className={styles.row}>
            <Input
              label="Age"
              type="number"
              min={0}
              max={150}
              value={user.age ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                const n = v === '' ? null : parseInt(v, 10);
                setUser((u) => (u ? { ...u, age: Number.isNaN(n) ? null : n } : u));
              }}
              disabled={saving}
            />
            <Input
              label="Region"
              value={user.region ?? ''}
              onChange={(e) => setUser((u) => (u ? { ...u, region: e.target.value } : u))}
              disabled={saving}
            />
          </div>
          <div className={styles.row}>
            <Input
              label="State"
              value={user.state ?? ''}
              onChange={(e) => setUser((u) => (u ? { ...u, state: e.target.value } : u))}
              disabled={saving}
            />
            <Input
              label="Timezone"
              value={user.timezone ?? ''}
              onChange={(e) => setUser((u) => (u ? { ...u, timezone: e.target.value } : u))}
              disabled={saving}
              placeholder="e.g. America/New_York"
            />
          </div>
          <Input
            label="Avatar URL"
            type="url"
            value={user.avatar ?? ''}
            onChange={(e) => setUser((u) => (u ? { ...u, avatar: e.target.value } : u))}
            disabled={saving}
            placeholder="https://..."
          />
          <Button type="submit" disabled={saving} className={styles.submit}>
            {saving ? 'Saving...' : 'Save profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}
