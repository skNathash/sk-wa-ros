import clsx from "clsx";
import { useMemo } from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import SectionTabService from "~/services/SectionTabService";
import type { SectionTab, SectionTabKey, TabItem } from "~/types/CommonTypes";

interface SectionTabsProps {
  /**
   * Which section's tabs to render (bill, business, supply, catalog).
   * Ignored when {@link tabs} is provided.
   */
  sectionKey?: SectionTabKey;
  /**
   * Explicit tab list, for callers that build their own tabs instead of
   * pulling a configured section from {@link SectionTabService}. Takes
   * precedence over {@link sectionKey}.
   */
  tabs?: SectionTab[];
  /** Key of the currently active tab. */
  activeTab: string;
  /**
   * Optional override for tab selection. When provided it is called with the
   * selected tab instead of the default redirect navigation.
   */
  onTabChange?: (tab: SectionTab) => void;
  variant?: "tabs" | "pills" | "underline" | "chips";
  className?: string;
  /** Optional extra classes applied to the outer wrapper div (sticky mode). */
  outerClassName?: string;
  /** For the underline variant: render a plain bottom border instead of a
   *  shadowed rounded card (useful for full-width / sticky tab bars). */
  noShadow?: boolean;
  /**
   * Render the tabs as a sticky bar pinned under the app header (theme-2 mobile
   * only). Breaks out of the parent's `p-4` page padding so the bottom border
   * runs edge to edge, and sticks immediately on scroll with no initial travel.
   */
  sticky?: boolean;
  /**
   * Leading/trailing inset of the tab track. Defaults to the page gutter
   * (16px); pass 0 when the bar sits inside an already-padded block.
   */
  slideOffset?: number;
  /**
   * Scroll the tab track natively instead of mounting a swiper. Defaults to
   * {@link sticky}: the sticky bar is full-bleed and sizes after mount, so the
   * swiper measures its track too early there and can leave the active tab
   * half-clipped at an edge. A native track has nothing to measure.
   */
  scrollable?: boolean;
}

const SectionTabs: React.FC<SectionTabsProps> = ({
  sectionKey,
  tabs: tabsProp,
  activeTab,
  onTabChange,
  variant = "chips",
  className = "",
  outerClassName = "",
  noShadow = false,
  sticky = false,
  slideOffset = 16,
  scrollable,
}) => {
  const appNav = useAppNav();

  // Mobile scroller omits desktop-only tabs; those show only in the desktop
  // side rail (SectionMenu).
  const sectionTabs = useMemo(() => {
    const source =
      tabsProp ?? (sectionKey ? SectionTabService.getTabs(sectionKey) : []);
    return source.filter((tab) => !tab.desktopOnly);
  }, [tabsProp, sectionKey]);

  const tabs: TabItem[] = useMemo(
    () =>
      sectionTabs.map((tab) => ({
        name: tab.label,
        key: tab.key,
        langKey: tab.langKey,
        icon: tab.icon,
        rbac: tab.rbac,
        className: tab.className,
        // The rail shows the badge on the icon; the tab row shows it as a
        // count pill, which only takes numbers.
        count: typeof tab.badge === "number" ? tab.badge : undefined,
      })),
    [sectionTabs],
  );

  const handleTabChange = (tab: TabItem) => {
    const sectionTab = sectionTabs.find((t) => t.key === tab.key);
    if (!sectionTab) return;

    if (onTabChange) {
      onTabChange(sectionTab);
      return;
    }

    appNav.to(sectionTab.redirect.url, sectionTab.redirect.params);
  };

  const appTab = (
    <AppTab
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      variant={variant}
      className={className}
      noShadow={noShadow}
      scrollable={scrollable ?? sticky}
      // The bar itself has no side padding (so the track scrolls edge to edge);
      // the swiper supplies the leading/trailing inset instead, keeping the
      // first pill aligned with the page gutter while pills still scroll under it.
      slideOffset={slideOffset}
    />
  );

  if (!sticky) return appTab;

  return (
    <div
      className={clsx(
        "theme-2-mobile-only section-menu-container",
        outerClassName,
      )}
    >
      {/* Styling seam only — the bar's surface + pill styling lives in
          theme-2.css (`.section-menu-container`). */}
      <div className="section-menu-track">{appTab}</div>
    </div>
  );
};

export default SectionTabs;
