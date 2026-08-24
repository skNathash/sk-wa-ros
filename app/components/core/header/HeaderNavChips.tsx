import clsx from "clsx";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { TABS, isTabActive } from "~/components/core/bottom-tab/BottomTab";
import { useActiveSection } from "~/shared/navigation/activeSection";

/**
 * Horizontal pill-group navigation over the top-level app sections (the same
 * tabs as {@link BottomTab}), shown in the desktop header. The active chip is
 * the section broadcast by the mounted `SectionMenu` (see
 * {@link useActiveSection}), falling back to a path match.
 * Rendered by {@link AppHeader} by default (opt out
 * via `showNavChips={false}`); visible only in theme-2 at lg+ (see
 * `.header-nav-chips` in theme-2.css — mobile uses the bottom tab instead).
 * Between lg and xl the chips are icon-only so the header title keeps its
 * room; the `.header-lead` max-width in theme-2.css is paired to those two
 * widths, so changing the chip padding/labels means updating it too.
 */
const HeaderNavChips = ({ className = "" }: { className?: string }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const sectionKey = useActiveSection();

  // A section's pages mostly live outside its tab path (e.g. Bill owns
  // /dashboard/delivery), so trust the section nav's broadcast first and only
  // fall back to matching the location when no section nav is mounted.
  const activeKey =
    (sectionKey && TABS.some((tab) => tab.key === sectionKey)
      ? sectionKey
      : null) ??
    TABS.find((tab) => isTabActive(location.pathname, tab.path))?.key;

  return (
    <nav
      className={clsx(
        "header-nav-chips tw:items-center tw:gap-0.5 tw:rounded-full tw:border tw:border-slate-200 tw:bg-slate-100/70 tw:p-0.5",
        className,
      )}
    >
      {TABS.map((tab) => {
        const active = tab.key === activeKey;
        const Icon = tab.icon;
        const label = t(tab.label, tab.label);
        return (
          <Link
            key={tab.key}
            to={tab.path}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            title={label}
            className={clsx(
              "tw:flex tw:items-center tw:gap-1 tw:rounded-full tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:transition-colors tw:duration-150",
              active
                ? "tw:bg-white tw:text-primary tw:shadow-sm"
                : "tw:text-slate-500 tw:hover:text-slate-800",
            )}
          >
            <Icon className="tw:h-3.5 tw:w-3.5 tw:shrink-0" />
            <span className="header-chip-label tw:hidden tw:xl:inline">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default HeaderNavChips;
