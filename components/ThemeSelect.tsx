'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { THEME_IDS, type ThemeId } from '@/lib/theme';

const THEME_LABELS: Record<ThemeId, string> = {
  dark: 'Dark',
  light: 'Light',
  dark2: 'Dark 2',
  light2: 'Light 2',
  dark3: 'Dark 3',
  light3: 'Light 3',
};

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as ThemeId)}
      aria-label="Select theme"
    >
      {THEME_IDS.map((id) => (
        <option key={id} value={id}>
          {THEME_LABELS[id]}
        </option>
      ))}
    </select>
  );
}
