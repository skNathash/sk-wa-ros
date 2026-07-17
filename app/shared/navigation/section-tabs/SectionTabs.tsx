import clsx from "clsx";
import { useMemo } from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import SectionTabService from "~/services/SectionTabService";
import type { SectionTab, SectionTabKey, TabItem } from "~/types/CommonTypes";

interface SectionTabsProps {
  /** Which section's tabs to render (bill, business, supply, catalog). */
  sectionKey: SectionTabKey;
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
}

const SectionTabs: React.FC<SectionTabsProps> = ({
  sectionKey,
  activeTab,
  onTabChange,
  variant = "chips",
  className = "",
  outerClassName = "",
  noShadow = false,
  sticky = false,
}) => {
  const appNav = useAppNav();

  // Mobile scroller omits desktop-only tabs (e.g. Receive Stock); those show
  // only in the desktop side rail (SectionMenu).
  const sectionTabs = useMemo(
    () => SectionTabService.getTabs(sectionKey).filter((tab) => !tab.desktopOnly),
    [sectionKey],
  );

  const tabs: TabItem[] = useMemo(
    () =>
      sectionTabs.map((tab) => ({
        name: tab.label,
        key: tab.key,
        langKey: tab.langKey,
        icon: tab.icon,
        rbac: tab.rbac,
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
      slideOffset={sticky ? 16 : 0}
    />
  );

  if (!sticky) return appTab;

  return (
    <div
      className={clsx("theme-2-mobile-only section-menu-container", outerClassName)}
    >
      {appTab}
    </div>
  );
};

export default SectionTabs;
