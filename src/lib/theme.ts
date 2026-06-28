// Appearance preferences (theme + accent), persisted to localStorage and applied
// to the document root. Kept outside the store so it can run before React mounts
// and avoid a flash of the wrong theme.

export type ThemePref = 'light' | 'dark' | 'system';

const THEME_KEY = 'quire.theme';
const ACCENT_KEY = 'quire.accent';

/** Built-in accent choices. `null` value = the brand default (lime). */
export const ACCENTS: { id: string; label: string; value: string | null }[] = [
  { id: 'lime', label: 'Lime', value: null },
  { id: 'sky', label: 'Sky', value: '#38c8ff' },
  { id: 'violet', label: 'Violet', value: '#7a4dd6' },
  { id: 'coral', label: 'Coral', value: '#ff6b5e' },
  { id: 'amber', label: 'Amber', value: '#ffb01a' },
  { id: 'teal', label: 'Teal', value: '#19c2a8' },
];

export function getThemePref(): ThemePref {
  const v = localStorage.getItem(THEME_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

export function getAccent(): string | null {
  return localStorage.getItem(ACCENT_KEY);
}

function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}

/** Applies the given (or stored) preferences to <html>. */
export function applyTheme(pref: ThemePref = getThemePref(), accent: string | null = getAccent()): void {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(pref);

  if (accent) {
    root.style.setProperty('--color-primary', accent);
    root.style.setProperty('--color-primary-active', `color-mix(in srgb, ${accent} 78%, #ffffff)`);
    root.style.setProperty('--color-primary-pale', `color-mix(in srgb, ${accent} 22%, #ffffff)`);
    root.style.setProperty('--color-primary-neutral', `color-mix(in srgb, ${accent} 45%, #ffffff)`);
  } else {
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-primary-active');
    root.style.removeProperty('--color-primary-pale');
    root.style.removeProperty('--color-primary-neutral');
  }
}

export function setThemePref(pref: ThemePref): void {
  localStorage.setItem(THEME_KEY, pref);
  applyTheme(pref);
}

export function setAccent(accent: string | null): void {
  if (accent) localStorage.setItem(ACCENT_KEY, accent);
  else localStorage.removeItem(ACCENT_KEY);
  applyTheme(getThemePref(), accent);
}

/** Re-applies on OS theme change while the preference is "system". */
export function watchSystemTheme(): void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    if (getThemePref() === 'system') applyTheme();
  });
}
