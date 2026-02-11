'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ButtonGroup } from '@/components/ui/ButtonGroup';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeBuilder } from '@/components/ThemeBuilder';
import type { User } from '@/types/user';
import styles from './profile.module.scss';

type ProfileTab = 'details' | 'security' | 'theme';

const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

const ACCEPT_IMAGE = 'image/jpeg,image/png,image/webp';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('details');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await fetch('/api/user');
    if (res.status === 401) {
      router.replace('/auth/signin?callbackUrl=/profile');
      return null;
    }
    const data = await res.json();
    if (data && !data.error) setUser(data);
    return data;
  }, [router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/profile');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    fetchProfile()
      .then(() => {})
      .catch(() => {
        if (!cancelled) setError('Failed to load profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, router, fetchProfile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || saving) return;
    setError(null);
    setSuccess(null);
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
      setSuccess('Profile saved.');
    } catch {
      setError('Something went wrong.');
    }
    setSaving(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploading || !session?.user?.id) return;
    if (!ACCEPT_IMAGE.split(',').includes(file.type)) {
      setError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const urlRes = await fetch('/api/user/avatar/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type,
          filename: file.name,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        setError((urlData.error as string) ?? 'Failed to get upload URL.');
        setUploading(false);
        return;
      }
      const { uploadUrl, key } = urlData as { uploadUrl: string; key: string };
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!putRes.ok) {
        setError('Failed to upload image.');
        setUploading(false);
        return;
      }
      const completeRes = await fetch('/api/user/avatar/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        setError((completeData.error as string) ?? 'Failed to save avatar.');
        setUploading(false);
        return;
      }
      setUser(completeData);
      setSuccess('Avatar updated.');
    } catch {
      setError('Something went wrong.');
    }
    setUploading(false);
    e.target.value = '';
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (changingPassword) return;
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError((data.error as string) ?? 'Failed to change password.');
        setChangingPassword(false);
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('Something went wrong.');
    }
    setChangingPassword(false);
  }

  async function handleDeleteAccount() {
    if (!showDeleteConfirm || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/user', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError((data.error as string) ?? 'Failed to delete account.');
        setDeleting(false);
        return;
      }
      await signOut({ redirect: false });
      router.replace('/auth/signin');
    } catch {
      setError('Something went wrong.');
      setDeleting(false);
    }
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
        {success && (
          <p className={styles.success} role="status">
            {success}
          </p>
        )}

        <div className={styles.profileLayout}>
          <nav className={styles.navColumn} aria-label="Profile sections">
            <ButtonGroup
              orientation="vertical"
              attached
              variant="outline"
              color="default"
            >
              <Button
                variant={activeTab === 'details' ? 'solid' : 'outline'}
                color={activeTab === 'details' ? 'primary' : 'default'}
                onClick={() => setActiveTab('details')}
              >
                Details
              </Button>
              <Button
                variant={activeTab === 'security' ? 'solid' : 'outline'}
                color={activeTab === 'security' ? 'primary' : 'default'}
                onClick={() => setActiveTab('security')}
              >
                Security
              </Button>
              <Button
                variant={activeTab === 'theme' ? 'solid' : 'outline'}
                color={activeTab === 'theme' ? 'primary' : 'default'}
                onClick={() => setActiveTab('theme')}
              >
                Theme
              </Button>
            </ButtonGroup>
          </nav>

          <div className={styles.contentColumn}>
            {activeTab === 'details' && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Details</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.avatarRow}>
                    <Avatar
                      src={user.avatar}
                      alt={user.name ?? 'Avatar'}
                      fallback={user.name ?? user.email ?? '?'}
                      size="lg"
                    />
                    <div className={styles.avatarActions}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPT_IMAGE}
                        onChange={handleAvatarChange}
                        className={styles.fileInput}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        color="secondary"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? 'Uploading...' : 'Change photo'}
                      </Button>
                    </div>
                  </div>
                  <div className={styles.row}>
                    <Input
                      label="First name"
                      value={user.firstName ?? ''}
                      onChange={(e) =>
                        setUser((u) =>
                          u ? { ...u, firstName: e.target.value } : u
                        )
                      }
                      disabled={saving}
                    />
                    <Input
                      label="Last name"
                      value={user.lastName ?? ''}
                      onChange={(e) =>
                        setUser((u) =>
                          u ? { ...u, lastName: e.target.value } : u
                        )
                      }
                      disabled={saving}
                    />
                  </div>
                  <Input
                    label="Display name"
                    value={user.name ?? ''}
                    onChange={(e) =>
                      setUser((u) => (u ? { ...u, name: e.target.value } : u))
                    }
                    disabled={saving}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={user.email ?? ''}
                    onChange={(e) =>
                      setUser((u) =>
                        u ? { ...u, email: e.target.value } : u
                      )
                    }
                    disabled={saving}
                  />
                  <Select
                    label="Gender"
                    options={GENDER_OPTIONS}
                    value={user.gender ?? ''}
                    onChange={(value) =>
                      setUser((u) =>
                        u ? { ...u, gender: value || null } : u
                      )
                    }
                    disabled={saving}
                  />
                  <Input
                    label="Username"
                    value={user.username ?? ''}
                    onChange={(e) =>
                      setUser((u) =>
                        u ? { ...u, username: e.target.value } : u
                      )
                    }
                    disabled={saving}
                  />
                  <Input
                    label="Address"
                    value={user.address ?? ''}
                    onChange={(e) =>
                      setUser((u) =>
                        u ? { ...u, address: e.target.value } : u
                      )
                    }
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
                        setUser((u) =>
                          u
                            ? { ...u, age: Number.isNaN(n) ? null : n }
                            : u
                        );
                      }}
                      disabled={saving}
                    />
                    <Input
                      label="Region"
                      value={user.region ?? ''}
                      onChange={(e) =>
                        setUser((u) =>
                          u ? { ...u, region: e.target.value } : u
                        )
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className={styles.row}>
                    <Input
                      label="State"
                      value={user.state ?? ''}
                      onChange={(e) =>
                        setUser((u) =>
                          u ? { ...u, state: e.target.value } : u
                        )
                      }
                      disabled={saving}
                    />
                    <Input
                      label="Timezone"
                      value={user.timezone ?? ''}
                      onChange={(e) =>
                        setUser((u) =>
                          u ? { ...u, timezone: e.target.value } : u
                        )
                      }
                      disabled={saving}
                      placeholder="e.g. America/New_York"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={saving}
                    className={styles.submit}
                  >
                    {saving ? 'Saving...' : 'Save profile'}
                  </Button>
                </form>
              </section>
            )}

            {activeTab === 'security' && (
              <>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Security</h2>
                  <form
                    onSubmit={handleChangePassword}
                    className={styles.form}
                  >
                    {passwordError && (
                      <p className={styles.error} role="alert">
                        {passwordError}
                      </p>
                    )}
                    {passwordSuccess && (
                      <p className={styles.success} role="status">
                        Password updated successfully.
                      </p>
                    )}
                    <Input
                      label="Current password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={changingPassword}
                    />
                    <Input
                      label="New password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={changingPassword}
                    />
                    <Input
                      label="Confirm new password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={changingPassword}
                    />
                    <Button
                      type="submit"
                      disabled={changingPassword}
                    >
                      {changingPassword
                        ? 'Changing...'
                        : 'Change password'}
                    </Button>
                  </form>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitleDanger}>Danger zone</h2>
                  <p className={styles.dangerText}>
                    Deleting your account will permanently remove your data.
                    This action cannot be undone.
                  </p>
                  {!showDeleteConfirm ? (
                    <Button
                      color="danger"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete account
                    </Button>
                  ) : (
                    <div className={styles.deleteConfirm}>
                      <p className={styles.deleteConfirmText}>
                        Are you sure? This cannot be undone.
                      </p>
                      <div className={styles.deleteActions}>
                        <Button
                          color="secondary"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="danger"
                          onClick={handleDeleteAccount}
                          disabled={deleting}
                        >
                          {deleting
                            ? 'Deleting...'
                            : 'Yes, delete my account'}
                        </Button>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}

            {activeTab === 'theme' && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Theme</h2>
                <ThemeBuilder />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
