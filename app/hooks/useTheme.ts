import { useCallback, useSyncExternalStore } from "react";
import StorageService from "~/services/StorageService";

/**
 * The theme currently applied to the document, read from the
 * `data-theme` attribute on <html> (set in root.tsx). Defaults to the value
 * rendered on the server so the first client render matches (no hydration
 * mismatch), then syncs to the live attribute after mount.
 *
 * Switching is live: both theme stylesheets are always loaded and keyed on
 * `[data-theme="..."]`, so flipping the attribute restyles the app without a
 * reload. Every consumer of this hook re-renders through the store below,
 * which is how the layout swaps SideMenu <-> Theme2SideMenu.
 */
export const DEFAULT_THEME = "theme-2";

/** localStorage key (StorageService prefixes it with `v2-`). */
export const THEME_STORAGE_KEY = "theme";

export const THEME_OPTIONS = [
  { value: "theme-1", label: "Classic" },
  { value: "theme-2", label: "Modern" },
] as const;

export type ThemeValue = (typeof THEME_OPTIONS)[number]["value"];

const isValidTheme = (value: unknown): value is ThemeValue =>
  THEME_OPTIONS.some((option) => option.value === value);

const readTheme = () =>
  (typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme")) ||
  DEFAULT_THEME;

/** The persisted theme, or the default when nothing valid is stored. */
export function getStoredTheme(): string {
  const stored = StorageService.get<string>(THEME_STORAGE_KEY);
  return isValidTheme(stored) ? stored : DEFAULT_THEME;
}

/**
 * Applies a theme to the document and persists it. The `data-theme` change is
 * picked up by every `useTheme()` consumer through the store below.
 */
export function applyTheme(theme: string) {
  if (typeof document === "undefined") return;
  const next = isValidTheme(theme) ? theme : DEFAULT_THEME;
  document.documentElement.setAttribute("data-theme", next);
  // The MutationObserver would catch this too, but it fires on a microtask;
  // notifying inline keeps the switch synchronous with the click.
  emit();
  try {
    StorageService.set(THEME_STORAGE_KEY, next);
  } catch {
    // storage failures shouldn't block the visual switch
  }
}

/*
 * `data-theme` on <html> is the single source of truth, so this is an external
 * store rather than React state: one shared MutationObserver feeds every
 * consumer, instead of one observer + one useState per call site.
 */
let listeners: Array<() => void> = [];
let observer: MutationObserver | null = null;

const emit = () => listeners.forEach((listener) => listener());

function subscribe(onStoreChange: () => void) {
  if (!observer) {
    observer = new MutationObserver(emit);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }
  listeners.push(onStoreChange);

  return () => {
    listeners = listeners.filter((listener) => listener !== onStoreChange);
    if (listeners.length === 0) {
      observer?.disconnect();
      observer = null;
    }
  };
}

export default function useTheme() {
  // The server snapshot must be DEFAULT_THEME: the theme a user actually has is
  // only known client-side (localStorage), so hydration has to start from the
  // rendered default and correct itself on mount.
  return useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);
}

/** `useTheme()` plus a setter — for the theme switcher in the side menus. */
export function useThemeSwitcher() {
  const theme = useTheme();
  const setTheme = useCallback((next: string) => applyTheme(next), []);
  return { theme, setTheme, options: THEME_OPTIONS };
}
