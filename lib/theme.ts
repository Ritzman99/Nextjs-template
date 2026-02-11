export type ThemeId = 'dark' | 'light' | 'dark2' | 'light2';

export const THEME_STORAGE_KEY = 'app-theme';

export const THEME_IDS: ThemeId[] = ['dark', 'light', 'dark2', 'light2'];

export const DEFAULT_THEME: ThemeId = 'dark';

const isValidThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && THEME_IDS.includes(value as ThemeId);

export function getStoredTheme(): ThemeId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw && isValidThemeId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function setStoredTheme(theme: ThemeId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}
