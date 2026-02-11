'use client';

import {
  DEFAULT_THEME,
  getStoredCustomTheme,
  getStoredTheme,
  setStoredTheme,
  THEME_TOKEN_KEYS,
  type CustomThemeRecord,
  type ThemeId,
} from '@/lib/theme';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyCustomThemeToDom(custom: CustomThemeRecord | null): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!custom || Object.keys(custom).length === 0) return;
  for (const key of THEME_TOKEN_KEYS) {
    const value = custom[key];
    if (value != null) root.style.setProperty(`--theme-${key}`, value);
  }
}

function clearCustomThemeFromDom(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const key of THEME_TOKEN_KEYS) {
    root.style.removeProperty(`--theme-${key}`);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = getStoredTheme();
    return stored ?? DEFAULT_THEME;
  });

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', stored);
      if (stored === 'custom') applyCustomThemeToDom(getStoredCustomTheme());
    }
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    if (typeof document !== 'undefined') {
      if (next !== 'custom') clearCustomThemeFromDom();
      document.documentElement.setAttribute('data-theme', next);
      if (next === 'custom') applyCustomThemeToDom(getStoredCustomTheme());
    }
    setStoredTheme(next);
    setThemeState(next);
  }, []);

  useEffect(() => {
    if (theme !== 'custom') return;
    applyCustomThemeToDom(getStoredCustomTheme());
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme }),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
