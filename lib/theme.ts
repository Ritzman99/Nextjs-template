export type ThemeId =
  | 'dark'
  | 'light'
  | 'dark2'
  | 'light2'
  | 'dark3'
  | 'light3'
  | 'custom';

export const THEME_STORAGE_KEY = 'app-theme';
export const THEME_CUSTOM_STORAGE_KEY = 'app-theme-custom';

export const THEME_IDS: ThemeId[] = [
  'dark',
  'light',
  'dark2',
  'light2',
  'dark3',
  'light3',
  'custom',
];

export const PRESET_THEME_IDS: ThemeId[] = [
  'dark',
  'light',
  'dark2',
  'light2',
  'dark3',
  'light3',
];

export const DEFAULT_THEME: ThemeId = 'dark';

/** All theme token keys used in the app (matches scss/themes/_dark.scss). */
export const THEME_TOKEN_KEYS = [
  'background',
  'foreground',
  'divider',
  'focus',
  'content1',
  'content2',
  'content3',
  'content4',
  'default',
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
  'default-50',
  'default-100',
  'default-200',
  'default-300',
  'default-400',
  'default-500',
  'default-600',
  'default-700',
  'default-800',
  'default-900',
  'primary-50',
  'primary-100',
  'primary-200',
  'primary-300',
  'primary-400',
  'primary-500',
  'primary-600',
  'primary-700',
  'primary-800',
  'primary-900',
  'secondary-50',
  'secondary-100',
  'secondary-200',
  'secondary-300',
  'secondary-400',
  'secondary-500',
  'secondary-600',
  'secondary-700',
  'secondary-800',
  'success-50',
  'success-100',
  'success-200',
  'success-300',
  'success-400',
  'success-500',
  'success-600',
  'success-700',
  'success-800',
  'success-900',
  'warning-50',
  'warning-100',
  'warning-200',
  'warning-300',
  'warning-400',
  'warning-500',
  'warning-600',
  'warning-700',
  'warning-800',
  'warning-900',
  'danger-50',
  'danger-100',
  'danger-200',
  'danger-300',
  'danger-400',
  'danger-500',
  'danger-600',
  'danger-700',
  'danger-800',
  'danger-900',
] as const;

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];

/** Grouped token keys for theme builder UI. */
export const THEME_TOKEN_GROUPS: Record<string, readonly ThemeTokenKey[]> = {
  Layout: [
    'background',
    'foreground',
    'divider',
    'focus',
  ],
  Content: ['content1', 'content2', 'content3', 'content4'],
  Base: ['default', 'primary', 'secondary', 'success', 'warning', 'danger'],
  'Default scale': [
    'default-50',
    'default-100',
    'default-200',
    'default-300',
    'default-400',
    'default-500',
    'default-600',
    'default-700',
    'default-800',
    'default-900',
  ],
  'Primary scale': [
    'primary-50',
    'primary-100',
    'primary-200',
    'primary-300',
    'primary-400',
    'primary-500',
    'primary-600',
    'primary-700',
    'primary-800',
    'primary-900',
  ],
  'Secondary scale': [
    'secondary-50',
    'secondary-100',
    'secondary-200',
    'secondary-300',
    'secondary-400',
    'secondary-500',
    'secondary-600',
    'secondary-700',
    'secondary-800',
  ],
  'Success scale': [
    'success-50',
    'success-100',
    'success-200',
    'success-300',
    'success-400',
    'success-500',
    'success-600',
    'success-700',
    'success-800',
    'success-900',
  ],
  'Warning scale': [
    'warning-50',
    'warning-100',
    'warning-200',
    'warning-300',
    'warning-400',
    'warning-500',
    'warning-600',
    'warning-700',
    'warning-800',
    'warning-900',
  ],
  'Danger scale': [
    'danger-50',
    'danger-100',
    'danger-200',
    'danger-300',
    'danger-400',
    'danger-500',
    'danger-600',
    'danger-700',
    'danger-800',
    'danger-900',
  ],
};

/** Dark theme values (hex) for "Start from Dark" in theme builder. */
export const DARK_THEME_VALUES: Record<ThemeTokenKey, string> = {
  background: '#000000',
  foreground: '#ECEDEE',
  divider: '#ffffff26',
  focus: '#006FEE',
  content1: '#18181b',
  content2: '#27272a',
  content3: '#3f3f46',
  content4: '#52525b',
  default: '#3f3f46',
  primary: '#006FEE',
  secondary: '#9353d3',
  success: '#17c964',
  warning: '#f5a524',
  danger: '#f31260',
  'default-50': '#18181b',
  'default-100': '#27272a',
  'default-200': '#3f3f46',
  'default-300': '#52525b',
  'default-400': '#71717a',
  'default-500': '#a1a1aa',
  'default-600': '#d4d4d8',
  'default-700': '#e4e4e7',
  'default-800': '#f4f4f5',
  'default-900': '#fafafa',
  'primary-50': '#001731',
  'primary-100': '#002e62',
  'primary-200': '#004493',
  'primary-300': '#005bc4',
  'primary-400': '#006FEE',
  'primary-500': '#338ef7',
  'primary-600': '#66aaf9',
  'primary-700': '#99c7fb',
  'primary-800': '#cce3fd',
  'primary-900': '#e6f1fe',
  'secondary-50': '#180828',
  'secondary-100': '#301050',
  'secondary-200': '#481878',
  'secondary-300': '#6020a0',
  'secondary-400': '#7828c8',
  'secondary-500': '#9353d3',
  'secondary-600': '#ae7ede',
  'secondary-700': '#c9a9e9',
  'secondary-800': '#f2eafa',
  'success-50': '#052e14',
  'success-100': '#0a5c28',
  'success-200': '#0f8a3c',
  'success-300': '#14b850',
  'success-400': '#17c964',
  'success-500': '#4ade80',
  'success-600': '#74e99a',
  'success-700': '#9ef4b4',
  'success-800': '#c9ffce',
  'success-900': '#dcfce7',
  'warning-50': '#312107',
  'warning-100': '#62420e',
  'warning-200': '#936316',
  'warning-300': '#c4841d',
  'warning-400': '#f5a524',
  'warning-500': '#f7b750',
  'warning-600': '#f9c97c',
  'warning-700': '#fbdba7',
  'warning-800': '#fdedd3',
  'warning-900': '#fefce8',
  'danger-50': '#310413',
  'danger-100': '#610726',
  'danger-200': '#920b3a',
  'danger-300': '#c20e4d',
  'danger-400': '#f31260',
  'danger-500': '#f54180',
  'danger-600': '#f871a0',
  'danger-700': '#faa0bf',
  'danger-800': '#fdd0df',
  'danger-900': '#fee7ef',
};

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

export type CustomThemeRecord = Partial<Record<ThemeTokenKey, string>>;

export function getStoredCustomTheme(): CustomThemeRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(THEME_CUSTOM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      return parsed as CustomThemeRecord;
    return null;
  } catch {
    return null;
  }
}

export function setStoredCustomTheme(custom: CustomThemeRecord): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_CUSTOM_STORAGE_KEY, JSON.stringify(custom));
  } catch {
    // ignore
  }
}

export function clearStoredCustomTheme(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(THEME_CUSTOM_STORAGE_KEY);
  } catch {
    // ignore
  }
}
