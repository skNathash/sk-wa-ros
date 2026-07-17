import { useEffect, useState } from "react";

/**
 * The theme currently applied to the document, read from the
 * `data-theme` attribute on <html> (set in root.tsx). Defaults to the value
 * rendered on the server so the first client render matches (no hydration
 * mismatch), then syncs to the live attribute after mount.
 */
const DEFAULT_THEME = "theme-2";

const readTheme = () =>
  (typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme")) ||
  DEFAULT_THEME;

export default function useTheme() {
  const [theme, setTheme] = useState<string>(DEFAULT_THEME);

  useEffect(() => {
    setTheme(readTheme());

    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}
