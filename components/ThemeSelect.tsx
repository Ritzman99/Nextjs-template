'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Select } from '@/components/ui';
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
  const optionIds =
    hasCustomTheme || (mounted && theme === 'custom')
      ? [...PRESET_THEME_IDS, 'custom']
      : PRESET_THEME_IDS;
  const value = mounted ? theme : DEFAULT_THEME;

  const options = optionIds.map((id) => ({
    value: id,
    label: THEME_LABELS[id as ThemeId],
  }));

  return (
    <Select
      options={options}
      value={value}
      onChange={(v) => setTheme(v as ThemeId)}
      placeholder="Select theme"
      aria-label="Select theme"
    />
  );
}
