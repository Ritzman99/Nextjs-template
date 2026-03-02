'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
  getPresetThemeId,
  getStoredPresetVariant,
  getThemeMode,
  getThemeVariant,
  setStoredPresetVariant,
  type ThemeId,
} from '@/lib/theme';
import styles from './ThemeToggle.module.scss';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mode = getThemeMode(theme);
  // When custom, show dark so toggle switches to light with stored variant
  const effectiveLight = mode === 'light';

  const handleToggle = () => {
    const nextMode = effectiveLight ? 'dark' : 'light';
    const nextVariant = mode != null ? getThemeVariant(theme) : getStoredPresetVariant();
    const nextTheme = getPresetThemeId(nextMode, nextVariant) as ThemeId;
    setStoredPresetVariant(nextVariant);
    setTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <div className={styles.wrapper} aria-hidden>
        <span className={styles.pill}>
          <span className={styles.option}>Dark</span>
          <span className={styles.option}>Light</span>
        </span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.pill}
        role="group"
        aria-label="Theme"
      >
        <button
          type="button"
          className={effectiveLight ? styles.option : `${styles.option} ${styles.optionActive}`}
          onClick={effectiveLight ? handleToggle : undefined}
          aria-pressed={!effectiveLight}
          aria-label="Dark"
          title="Dark"
        >
          <Moon size={18} aria-hidden />
          <span>Dark</span>
        </button>
        <button
          type="button"
          className={effectiveLight ? `${styles.option} ${styles.optionActive}` : styles.option}
          onClick={!effectiveLight ? handleToggle : undefined}
          aria-pressed={effectiveLight}
          aria-label="Light"
          title="Light"
        >
          <Sun size={18} aria-hidden />
          <span>Light</span>
        </button>
      </div>
    </div>
  );
}
