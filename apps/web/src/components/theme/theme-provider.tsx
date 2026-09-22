'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';

export type AccentColorId =
  | 'violet'
  | 'indigo'
  | 'sky'
  | 'emerald'
  | 'amber'
  | 'rose';

export type AccentColor = {
  readonly id: AccentColorId;
  readonly name: string;
  readonly lightPrimary: string;
  readonly darkPrimary: string;
  readonly lightGlow: string;
  readonly darkGlow: string;
};

export const ACCENT_COLORS: readonly AccentColor[] = [
  {
    id: 'violet',
    name: 'Mor',
    lightPrimary: '#7c3aed',
    darkPrimary: '#a78bfa',
    lightGlow: 'rgb(124 58 237 / 0.16)',
    darkGlow: 'rgb(167 139 250 / 0.32)',
  },
  {
    id: 'indigo',
    name: 'Çivit',
    lightPrimary: '#4f5ad0',
    darkPrimary: '#7c86d8',
    lightGlow: 'rgb(79 90 208 / 0.16)',
    darkGlow: 'rgb(124 134 216 / 0.32)',
  },
  {
    id: 'sky',
    name: 'Gök Mavisi',
    lightPrimary: '#0284c7',
    darkPrimary: '#38bdf8',
    lightGlow: 'rgb(2 132 199 / 0.16)',
    darkGlow: 'rgb(56 189 248 / 0.32)',
  },
  {
    id: 'emerald',
    name: 'Zümrüt',
    lightPrimary: '#059669',
    darkPrimary: '#34d399',
    lightGlow: 'rgb(5 150 105 / 0.16)',
    darkGlow: 'rgb(52 211 153 / 0.32)',
  },
  {
    id: 'amber',
    name: 'Kehribar',
    lightPrimary: '#d97706',
    darkPrimary: '#fbbf24',
    lightGlow: 'rgb(217 119 6 / 0.16)',
    darkGlow: 'rgb(251 191 36 / 0.32)',
  },
  {
    id: 'rose',
    name: 'Gül',
    lightPrimary: '#e11d48',
    darkPrimary: '#fb7185',
    lightGlow: 'rgb(225 29 72 / 0.16)',
    darkGlow: 'rgb(251 113 133 / 0.32)',
  },
];

type ThemeContextValue = {
  readonly theme: Theme;
  readonly resolvedTheme: 'light' | 'dark';
  readonly setTheme: (theme: Theme) => void;
  readonly accentColor: AccentColor;
  readonly setAccentColor: (id: AccentColorId) => void;
};

const STORAGE_KEY = 'planner-theme';
const ACCENT_STORAGE_KEY = 'planner-accent';

const DEFAULT_ACCENT: AccentColorId = 'indigo';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'system';
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function getInitialAccentId(): AccentColorId {
  if (typeof window === 'undefined') {
    return DEFAULT_ACCENT;
  }
  const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return ACCENT_COLORS.some((color) => color.id === stored) ? (stored as AccentColorId) : DEFAULT_ACCENT;
}

function resolveAccent(id: AccentColorId): AccentColor {
  return (
    ACCENT_COLORS.find((color) => color.id === id) ??
    ACCENT_COLORS.find((color) => color.id === DEFAULT_ACCENT) ??
    (ACCENT_COLORS[0] as AccentColor)
  );
}

function applyAccent(id: AccentColorId, resolved: 'light' | 'dark') {
  const accent = resolveAccent(id);
  const root = document.documentElement;

  root.style.setProperty('--primary', resolved === 'dark' ? accent.darkPrimary : accent.lightPrimary);
  root.style.setProperty(
    '--primary-foreground',
    resolved === 'dark' ? '#0e0e13' : '#ffffff',
  );
  root.style.setProperty('--ring', resolved === 'dark' ? accent.darkPrimary : accent.lightPrimary);
  root.style.setProperty('--shadow-glow', resolved === 'dark' ? accent.darkGlow : accent.lightGlow);
}

function clearAccentOverrides() {
  const root = document.documentElement;
  root.style.removeProperty('--primary');
  root.style.removeProperty('--primary-foreground');
  root.style.removeProperty('--ring');
  root.style.removeProperty('--shadow-glow');
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? systemTheme() : theme;
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

const themeInitScript = `(function () {
  var stored = null;
  try { stored = localStorage.getItem('${STORAGE_KEY}'); } catch (e) {}
  var theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  var resolved = theme === 'system'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  var root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;

  var accentStored = null;
  try { accentStored = localStorage.getItem('${ACCENT_STORAGE_KEY}'); } catch (e) {}
  var accent = accentStored;
  var palettes = ${JSON.stringify(
    ACCENT_COLORS.map(({ id, lightPrimary, darkPrimary, lightGlow, darkGlow }) => ({
      id,
      lightPrimary,
      darkPrimary,
      lightGlow,
      darkGlow,
    })),
  )};
  var match = palettes.filter(function (p) { return p.id === accent; })[0];
  if (!match) match = palettes[0];
  if (match) {
    root.style.setProperty('--primary', resolved === 'dark' ? match.darkPrimary : match.lightPrimary);
    root.style.setProperty('--primary-foreground', resolved === 'dark' ? '#0e0e13' : '#ffffff');
    root.style.setProperty('--ring', resolved === 'dark' ? match.darkPrimary : match.lightPrimary);
    root.style.setProperty('--shadow-glow', resolved === 'dark' ? match.darkGlow : match.lightGlow);
  }
})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [accentColorId, setAccentColorIdState] = useState<AccentColorId>(getInitialAccentId);

  const themeRef = useRef(theme);
  const accentRef = useRef(accentColorId);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    accentRef.current = accentColorId;
  }, [accentColorId]);

  useEffect(() => {
    applyTheme(resolveTheme(theme));
    applyAccent(accentColorId, resolveTheme(theme));

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (themeRef.current !== 'system') {
        return;
      }
      const next = systemTheme();
      setResolvedTheme(next);
      applyTheme(next);
      applyAccent(accentRef.current, next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme, accentColorId]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    applyAccent(accentRef.current, resolved);
  }, []);

  const setAccentColor = useCallback((next: AccentColorId) => {
    clearAccentOverrides();
    setAccentColorIdState(next);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, next);
    applyAccent(next, resolveTheme(themeRef.current));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      accentColor: resolveAccent(accentColorId),
      setAccentColor,
    }),
    [theme, resolvedTheme, setTheme, accentColorId, setAccentColor],
  );

  return (
    <ThemeContext.Provider value={value}>
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}