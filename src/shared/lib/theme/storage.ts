import type { ThemeMode } from './types';

export const THEME_STORAGE_KEY = 'llm-integrator-theme';

function parseStoredTheme(value: string | null): ThemeMode | null {
  if (value === 'light' || value === 'dark') return value;
  return null;
}

export function readStoredTheme(): ThemeMode | null {
  try {
    return parseStoredTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Prefer saved choice; otherwise follow OS `prefers-color-scheme`. */
export function getInitialTheme(): ThemeMode {
  const stored = readStoredTheme();
  if (stored) return stored;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}
