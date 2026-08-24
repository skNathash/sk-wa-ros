import {
  ChartNoAxesColumn,
  ListOrdered,
  Settings,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import LoyaltyPointService, {
  type CoinSectionTabKey,
} from "~/services/LoyaltyPointService";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { SectionTab, TabItem } from "~/types/CommonTypes";

interface CoinsTabProps {
  activeTab?: CoinSectionTabKey;
  className?: string;
  /**
   * Ride the shared sticky section-tab bar instead of rendering the in-page
   * pill strip — the theme-2 phone treatment (see the customer detail layout).
   * The bar hides itself outside theme-2 mobile, so a page mounts this copy at
   * the top of the container and hides its in-content strip below md.
   */
  sticky?: boolean;
}

/** The icon names the service hands back, resolved to lucide elements. */
const ICONS: Record<string, ReactNode> = {
  chart: <ChartNoAxesColumn />,
  settings: <Settings />,
  list: <ListOrdered />,
  sparkles: <Sparkles />,
};

/**
 * The King Coins sub-nav. The tab set and where each tab goes live in
 * `LoyaltyPointService.getSectionTabs()`, so every coins page shows the same
 * strip and only says which tab it is.
 */
const CoinsTab = ({
  activeTab = "config",
  className = "",
  sticky = false,
}: CoinsTabProps) => {
  const appNav = useAppNav();

  const sectionTabs = useMemo(() => LoyaltyPointService.getSectionTabs(), []);

  const tabs: TabItem[] = useMemo(
    () =>
      sectionTabs.map((tab) => ({
        key: tab.key,
        name: tab.name,
        langKey: tab.langKey,
        icon: tab.icon ? ICONS[tab.icon] : undefined,
      })),
    [sectionTabs],
  );

  const initialTab = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  const handleTabChange = (tab: TabItem) => {
    const sectionTab = sectionTabs.find((t) => t.key === tab.key);
    if (!sectionTab) return;
    appNav.to(sectionTab.redirect.url, sectionTab.redirect.params);
  };

  if (sticky) {
    // The bar navigates on its own — each tab carries its destination.
    const stickyTabs: SectionTab[] = sectionTabs.map((tab) => ({
      key: tab.key,
      label: tab.name,
      langKey: tab.langKey,
      icon: tab.icon ? ICONS[tab.icon] : undefined,
      redirect: tab.redirect,
    }));

    return (
      <SectionTabs
        tabs={stickyTabs}
        activeTab={initialTab?.key ?? activeTab}
        noShadow
        sticky
        // The bar's own padding leaves the first card hugging it; add the page
        // gutter back below it. Safe as a plain margin — the container is
        // display:none outside theme-2 mobile.
        outerClassName="tw:mb-3"
      />
    );
  }

  return (
    <div className={className}>
      <AppTab
        activeTab={initialTab?.key}
        tabs={tabs}
        onTabChange={handleTabChange}
        variant="pills"
      />
    </div>
  );
};

export default CoinsTab;
