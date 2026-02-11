'use client';

import {
  DEFAULT_THEME,
  getStoredTheme,
  setStoredTheme,
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = getStoredTheme();
    return stored ?? DEFAULT_THEME;
  });

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next);
    }
    setStoredTheme(next);
    setThemeState(next);
  }, []);

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
