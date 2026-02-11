'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { ThemeSelect } from '@/components/ThemeSelect';
import { Button } from '@/components/ui/Button';
import {
  clearStoredCustomTheme,
  DARK_THEME_VALUES,
  getStoredCustomTheme,
  setStoredCustomTheme,
  THEME_TOKEN_GROUPS,
  type CustomThemeRecord,
  type ThemeId,
  type ThemeTokenKey,
} from '@/lib/theme';
import styles from './ThemeBuilder.module.scss';

const DEBOUNCE_MS = 300;

function normalizeHex(value: string): string {
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v) || /^#[0-9A-Fa-f]{8}$/.test(v)) return v;
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return '#' + v;
  if (/^[0-9A-Fa-f]{8}$/.test(v)) return '#' + v;
  return value;
}

function colorInputValue(hex: string): string {
  if (hex.length === 9 && hex.startsWith('#')) return hex.slice(0, 7);
  return hex;
}

export function ThemeBuilder() {
  const { setTheme } = useTheme();
  const [values, setValues] = useState<CustomThemeRecord>(() => {
    const stored = getStoredCustomTheme();
    if (stored && Object.keys(stored).length > 0) return stored;
    return { ...DARK_THEME_VALUES };
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyToDom = useCallback((record: CustomThemeRecord) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(record)) {
      if (value != null) root.style.setProperty(`--theme-${key}`, value);
    }
  }, []);

  const persist = useCallback((next: CustomThemeRecord) => {
    setStoredCustomTheme(next);
    applyToDom(next);
  }, [applyToDom]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateToken = useCallback(
    (key: ThemeTokenKey, value: string) => {
      const normalized = normalizeHex(value);
      setValues((prev) => {
        const next = { ...prev, [key]: normalized };
        applyToDom(next);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => persist(next), DEBOUNCE_MS);
        return next;
      });
    },
    [applyToDom, persist]
  );

  const startFromDark = useCallback(() => {
    const next = { ...DARK_THEME_VALUES };
    setValues(next);
    persist(next);
    setTheme('custom' as ThemeId);
  }, [persist, setTheme]);

  const clearCustom = useCallback(() => {
    clearStoredCustomTheme();
    setTheme('dark');
    setValues({ ...DARK_THEME_VALUES });
  }, [setTheme]);

  const useCustomTheme = useCallback(() => {
    persist(values);
    setTheme('custom' as ThemeId);
  }, [values, persist, setTheme]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.presetRow}>
        <span className={styles.presetLabel}>Preset theme</span>
        <ThemeSelect />
      </div>

      <h3 className={styles.sectionTitle}>Custom theme</h3>
      <p className={styles.presetLabel} style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--theme-default-500)' }}>
        Change colors below to build a custom theme. Changes apply live and are saved automatically.
      </p>

      {Object.entries(THEME_TOKEN_GROUPS).map(([groupName, keys]) => (
        <section key={groupName} className={styles.section}>
          <h4 className={styles.sectionTitle}>{groupName}</h4>
          {keys.map((key) => {
            const value = values[key] ?? DARK_THEME_VALUES[key] ?? '#000000';
            return (
              <div key={key} className={styles.row}>
                <span className={styles.label}>{key}</span>
                <div className={styles.colorCell}>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={colorInputValue(value)}
                    onChange={(e) => updateToken(key, e.target.value)}
                    aria-label={`${key} color`}
                  />
                  <input
                    type="text"
                    className={styles.hexInput}
                    value={value}
                    onChange={(e) => updateToken(key, e.target.value)}
                    aria-label={`${key} hex`}
                    placeholder="#000000"
                  />
                </div>
              </div>
            );
          })}
        </section>
      ))}

      <div className={styles.actions}>
        <Button type="button" variant="outline" color="secondary" onClick={startFromDark}>
          Start from Dark
        </Button>
        <Button type="button" variant="outline" color="primary" onClick={useCustomTheme}>
          Use custom theme
        </Button>
        <Button type="button" variant="outline" color="danger" onClick={clearCustom}>
          Clear custom theme
        </Button>
      </div>
    </div>
  );
}
