'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
  DEFAULT_THEME,
  getStoredCustomTheme,
  PRESET_THEME_IDS,
  type ThemeId,
} from '@/lib/theme';

const THEME_LABELS: Record<ThemeId, string> = {
  dark: 'Dark',
  light: 'Light',
  dark2: 'Dark 2',
  light2: 'Light 2',
  dark3: 'Dark 3',
  light3: 'Light 3',
  custom: 'Custom',
};

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before mount, render the same as server (presets only, default value) to avoid hydration mismatch.
  const customTheme = mounted ? getStoredCustomTheme() : null;
  const hasCustomTheme =
    customTheme != null && Object.keys(customTheme).length > 0;
  const options =
    hasCustomTheme || (mounted && theme === 'custom')
      ? [...PRESET_THEME_IDS, 'custom']
      : PRESET_THEME_IDS;
  const value = mounted ? theme : DEFAULT_THEME;

  return (
    <select
      value={value}
      onChange={(e) => setTheme(e.target.value as ThemeId)}
      aria-label="Select theme"
    >
      {options.map((id) => (
        <option key={id} value={id}>
          {THEME_LABELS[id as ThemeId]}
        </option>
      ))}
    </select>
  );
}
