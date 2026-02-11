'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import {
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
  const customTheme = getStoredCustomTheme();
  const hasCustomTheme =
    customTheme && Object.keys(customTheme).length > 0;
  const options = hasCustomTheme || theme === 'custom'
    ? [...PRESET_THEME_IDS, 'custom']
    : PRESET_THEME_IDS;

  return (
    <select
      value={theme}
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
