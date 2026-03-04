'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  FormSection,
  FormRow,
  FormActions,
  Radio,
  Checkbox,
  Alert,
  Input,
  NumberInput,
  Select,
} from '@/components/ui';
import type { ProjectConfig, TemplateSectionsConfig } from '@/types/projectConfig';
import { DEFAULT_PROJECT_CONFIG } from '@/types/projectConfig';
import styles from './setup.module.scss';

const SECTION_OPTIONS: { key: keyof TemplateSectionsConfig; label: string }[] = [
  { key: 'authentication', label: 'Authentication' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'profile', label: 'Profile' },
  { key: 'docs', label: 'Components (docs)' },
  { key: 'admin', label: 'Admin portal' },
];

export default function SetupPage() {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rolesPreset, setRolesPreset] = useState<'basic' | 'extended'>('basic');
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({ Admin: 1, User: 5 });
  const [defaultPassword, setDefaultPassword] = useState('password');
  const [seedMessage, setSeedMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [seedLoading, setSeedLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/setup/config');
        if (!res.ok) throw new Error('Failed to load config');
        const data = await res.json();
        if (!cancelled && data.config) {
          setConfig(data.config as ProjectConfig);
        }
      } catch {
        if (!cancelled) setSaveMessage({ type: 'error', text: 'Could not load config' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveConfig = async () => {
    setSaveMessage(null);
    try {
      const res = await fetch('/api/setup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaveMessage({ type: 'success', text: 'Configuration saved. Run the apply script to apply changes.' });
    } catch (e) {
      setSaveMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Save failed',
      });
    }
  };

  const handleSeed = async (kind: 'sections' | 'roles' | 'users') => {
    setSeedMessage(null);
    setSeedLoading(kind);
    try {
      if (kind === 'sections') {
        const res = await fetch('/api/setup/seed/sections', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Seed failed');
        setSeedMessage({ type: 'success', text: data.message ?? 'Sections seeded.' });
      } else if (kind === 'roles') {
        const res = await fetch('/api/setup/seed/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preset: rolesPreset }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Seed failed');
        setSeedMessage({ type: 'success', text: data.message ?? 'Roles seeded.' });
      } else {
        const res = await fetch('/api/setup/seed/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleCounts, defaultPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Seed failed');
        setSeedMessage({ type: 'success', text: data.message ?? 'Users seeded.' });
      }
    } catch (e) {
      setSeedMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Seed failed',
      });
    } finally {
      setSeedLoading(null);
    }
  };

  const updateSection = (key: keyof TemplateSectionsConfig, value: boolean) => {
    setConfig((c) => ({
      ...c,
      sections: { ...c.sections, [key]: value },
    }));
  };

  const updateRoleCount = (roleName: string, value: number) => {
    setRoleCounts((prev) => ({ ...prev, [roleName]: value }));
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <p>Loading configuration…</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.pageTitle}>Project setup</h1>
      <p className={styles.pageDescription}>
        Configure this template after cloning. Save your choices, then run the apply script to remove
        pages and update code. Seed actions run against the database (development only).
      </p>

      <Card className={styles.card}>
        <Form onSubmit={(e) => { e.preventDefault(); handleSaveConfig(); }}>
          <FormSection title="Organization">
            <p className={styles.sectionTitle}>Organization</p>
            <div className={styles.radioGroup}>
              <Radio
                name="organization"
                label="Full (Companies, Locations, Teams)"
                checked={config.organization === 'full'}
                onChange={() => setConfig((c) => ({ ...c, organization: 'full' }))}
              />
              <Radio
                name="organization"
                label="Teams only (Companies and Locations removed)"
                checked={config.organization === 'teams-only'}
                onChange={() => setConfig((c) => ({ ...c, organization: 'teams-only' }))}
              />
            </div>
          </FormSection>

          <FormSection title="Sections">
            <p className={styles.sectionTitle}>Include these sections</p>
            <div className={styles.checkboxGroup}>
              {SECTION_OPTIONS.map(({ key, label }) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={config.sections[key]}
                  onChange={(e) => updateSection(key, e.target.checked)}
                />
              ))}
            </div>
          </FormSection>

          <FormActions>
            <Button type="submit" variant="solid">
              Save configuration
            </Button>
          </FormActions>
        </Form>

        {saveMessage && (
          <Alert
            className={styles.message}
            color={saveMessage.type === 'error' ? 'danger' : 'success'}
            variant="soft"
          >
            {saveMessage.text}
          </Alert>
        )}

        <div className={styles.applyBlock}>
          <p className={styles.sectionTitle}>Apply configuration</p>
          <p>
            After saving, run this in your terminal to remove disabled pages and update the codebase:
          </p>
          <p>
            <code>npm run apply-template-config</code>
          </p>
          <p>
            Then restart the dev server. Seed actions below use the current code (run apply first so
            &quot;Seed sections&quot; seeds only the sections you kept).
          </p>
        </div>
      </Card>

      <Card className={styles.card}>
        <p className={styles.sectionTitle}>Seed actions</p>
        <p>Run these after applying configuration (development only).</p>

        <div className={styles.seedRow}>
          <Button
            variant="outline"
            onClick={() => handleSeed('sections')}
            disabled={!!seedLoading}
          >
            {seedLoading === 'sections' ? 'Seeding…' : 'Seed sections'}
          </Button>
          <span>Seeds permission sections from the current template (run after apply).</span>
        </div>

        <div className={styles.seedRow} style={{ marginTop: 'var(--unit-4)' }}>
          <Select
            value={rolesPreset}
            onChange={(value) => setRolesPreset(value as 'basic' | 'extended')}
            options={[
              { value: 'basic', label: 'Basic (User + Admin)' },
              { value: 'extended', label: 'Extended' },
            ]}
          />
          <Button
            variant="outline"
            onClick={() => handleSeed('roles')}
            disabled={!!seedLoading}
          >
            {seedLoading === 'roles' ? 'Seeding…' : 'Seed roles'}
          </Button>
        </div>

        <div style={{ marginTop: 'var(--unit-6)' }}>
          <p className={styles.sectionTitle}>Seed users</p>
          <p>Number of users to create per role (e.g. Admin: 1, User: 5).</p>
          <div className={styles.roleCountRow}>
            <label htmlFor="count-admin">Admin</label>
            <NumberInput
              id="count-admin"
              value={roleCounts['Admin'] ?? 0}
              onChange={(value) => updateRoleCount('Admin', value ?? 0)}
              min={0}
              max={100}
            />
          </div>
          <div className={styles.roleCountRow}>
            <label htmlFor="count-user">User</label>
            <NumberInput
              id="count-user"
              value={roleCounts['User'] ?? 0}
              onChange={(value) => updateRoleCount('User', value ?? 0)}
              min={0}
              max={100}
            />
          </div>
          <div className={styles.roleCountRow}>
            <label htmlFor="default-password">Default password</label>
            <Input
              id="default-password"
              type="text"
              value={defaultPassword}
              onChange={(e) => setDefaultPassword(e.target.value)}
              placeholder="password"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => handleSeed('users')}
            disabled={!!seedLoading}
            style={{ marginTop: 'var(--unit-2)' }}
          >
            {seedLoading === 'users' ? 'Seeding…' : 'Seed users'}
          </Button>
        </div>

        {seedMessage && (
          <Alert
            className={styles.message}
            color={seedMessage.type === 'error' ? 'danger' : 'success'}
            variant="soft"
          >
            {seedMessage.text}
          </Alert>
        )}
      </Card>
    </div>
  );
}
