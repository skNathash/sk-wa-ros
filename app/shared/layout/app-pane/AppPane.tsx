import clsx from "clsx";
import React from "react";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import useTheme from "~/hooks/useTheme";
import MiscService from "~/services/MiscService";

/**
 * Column pair for section pages that use the WhatsApp-style split layout in
 * theme-2 desktop (see `.app-pane-side` / `.app-pane-main` in theme-2.css).
 *
 * Both render inside the page's 12-column content grid:
 * - {@link AppPaneMain} — the main feed column (9/12 on lg by default).
 * - {@link AppPaneSide} — the secondary column (3/12 on lg by default).
 *
 * In every theme except theme-2 desktop that is all they do. In theme-2 at
 * lg+ the CSS lifts `AppPaneSide` out of the grid into a fixed, full-height
 * white list pane between the section icon rail and the content, and
 * `AppPaneMain` expands to span the full grid; the sticky header and footer
 * shift right to clear the pane. Content inside the columns is untouched.
 *
 * Pass `app-pane-only` in `AppPaneSide`'s className for a pane that belongs to
 * the theme-2 layout alone — it then renders nothing in the other themes,
 * rather than being hidden by CSS.
 *
 * Usage:
 * ```tsx
 * <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
 *   <AppPaneMain>…feed…</AppPaneMain>
 *   <AppPaneSide>…calendar, events…</AppPaneSide>
 * </div>
 * ```
 */
interface AppPaneProps {
  children: React.ReactNode;
  /** Extra classes merged after the defaults (e.g. a different lg span). */
  className?: string;
}

export const AppPaneMain: React.FC<AppPaneProps> = ({
  children,
  className = "",
}) => (
  <div
    className={clsx(
      "app-pane-main tw:col-span-12 tw:lg:col-span-9 tw:space-y-4",
      className,
    )}
  >
    {children}
  </div>
);

export const AppPaneSide: React.FC<AppPaneProps> = ({
  children,
  className = "",
}) => {
  const theme = useTheme();

  if (!MiscService.isDesktopView()) {
    return null;
  }

  // `app-pane-only` marks a pane whose content exists solely inside the theme-2
  // split layout. The CSS already hides it elsewhere; skipping the render keeps
  // its children (and their fetches) out of the other themes entirely.
  if (className.includes("app-pane-only") && theme !== "theme-2") {
    return null;
  }

  return (
    <div
      className={clsx(
        "app-pane-side tw:col-span-12 tw:lg:col-span-3",
        className,
      )}
    >
      <AppScrollArea className="tw:h-full">
        <div className="tw:space-y-4">{children}</div>
      </AppScrollArea>
    </div>
  );
};
