'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input, Select, Checkbox, Button } from '@/components/ui';
import styles from '../admin.module.scss';

export type ScopeLevel = 'global' | 'company' | 'location' | 'team';

export interface RoleFormData {
  name: string;
  scopeLevel: ScopeLevel;
  companyId: string;
  locationId: string;
  teamId: string;
  permissions: Array<{ section: string; actions: string[] }>;
}

/** Section shape for the permission matrix (from API). */
export interface SectionForRole {
  id: string;
  label: string;
  allowedActions: string[];
}

const SCOPE_OPTIONS = [
  { value: 'global', label: 'Global' },
  { value: 'company', label: 'Company' },
  { value: 'location', label: 'Location' },
  { value: 'team', label: 'Team' },
];

export function getDefaultFormData(existing?: Partial<RoleFormData> | null): RoleFormData {
  return {
    name: existing?.name ?? '',
    scopeLevel: (existing?.scopeLevel as ScopeLevel) ?? 'global',
    companyId: existing?.companyId ?? '',
    locationId: existing?.locationId ?? '',
    teamId: existing?.teamId ?? '',
    permissions: existing?.permissions?.length ? [...existing.permissions] : [],
  };
}

export interface RoleFormProps {
  initialData: RoleFormData;
  onSubmit: (data: RoleFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function RoleForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: RoleFormProps) {
  const [data, setData] = useState<RoleFormData>(initialData);
  const [sections, setSections] = useState<SectionForRole[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/sections')
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Array<{ id: string; name: string; slug: string; allowedActions: string[] }>) => {
        if (cancelled) return;
        setSections(
          list.map((s) => ({
            id: s.slug,
            label: s.name,
            allowedActions: Array.isArray(s.allowedActions) ? s.allowedActions : [],
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setSections([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(<K extends keyof RoleFormData>(key: K, value: RoleFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setSectionActions = useCallback((sectionId: string, actions: string[]) => {
    setData((prev) => {
      const perms = prev.permissions.map((p) =>
        p.section === sectionId ? { ...p, actions } : p
      );
      const hasSection = perms.some((p) => p.section === sectionId);
      if (!hasSection) perms.push({ section: sectionId, actions });
      return { ...prev, permissions: perms };
    });
  }, []);

  const getSectionActions = useCallback(
    (sectionId: string): string[] => {
      const p = data.permissions.find((x) => x.section === sectionId);
      return p?.actions ?? [];
    },
    [data.permissions]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const toSend: RoleFormData = {
        ...data,
        permissions: data.permissions.filter((p) => p.actions.length > 0),
      };
      await onSubmit(toSend);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'var(--theme-danger)', marginBottom: 'var(--unit-4)' }}>{error}</p>}
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Details</h2>
        <div className={styles.formRow}>
          <Input
            label="Name"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            required
            placeholder="Role name"
          />
          <Select
            label="Scope level"
            options={SCOPE_OPTIONS}
            value={data.scopeLevel}
            onChange={(v) => update('scopeLevel', v as ScopeLevel)}
          />
        </div>
        <div className={styles.formRow}>
          <Input
            label="Company ID (optional)"
            value={data.companyId}
            onChange={(e) => update('companyId', e.target.value)}
            placeholder="ObjectId"
          />
          <Input
            label="Location ID (optional)"
            value={data.locationId}
            onChange={(e) => update('locationId', e.target.value)}
            placeholder="ObjectId"
          />
          <Input
            label="Team ID (optional)"
            value={data.teamId}
            onChange={(e) => update('teamId', e.target.value)}
            placeholder="ObjectId"
          />
        </div>
      </div>

      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Permissions</h2>
        <p className={styles.pageDescription} style={{ marginBottom: 'var(--unit-4)' }}>
          For each section, select allowed actions. Use * for full access to that section.
        </p>
        {sections === null ? (
          <p className={styles.pageDescription}>Loading permissions…</p>
        ) : sections.length === 0 ? (
          <p className={styles.pageDescription}>No sections defined. Add sections in Admin → Sections first.</p>
        ) : (
          <div className={styles.permissionGrid}>
            {sections.map((section) => {
              const actions = getSectionActions(section.id);
              const hasFull = actions.includes('*');
              const toggleAction = (action: string) => {
                if (action === '*') {
                  setSectionActions(section.id, hasFull ? [] : ['*']);
                  return;
                }
                if (hasFull) {
                  setSectionActions(section.id, [action]);
                  return;
                }
                const next = actions.includes(action)
                  ? actions.filter((a) => a !== action)
                  : [...actions, action];
                setSectionActions(section.id, next);
              };
              return (
                <div key={section.id} className={styles.permissionSection}>
                  <strong>{section.label}</strong>
                  <div style={{ marginTop: 'var(--unit-2)' }}>
                    <Checkbox
                      label="* (full)"
                      checked={hasFull}
                      onChange={() => toggleAction('*')}
                    />
                    {section.allowedActions.filter((a) => a !== '*').map((action) => (
                      <Checkbox
                        key={action}
                        label={action}
                        checked={hasFull || actions.includes(action)}
                        onChange={() => toggleAction(action)}
                        disabled={hasFull}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
