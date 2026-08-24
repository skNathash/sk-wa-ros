import clsx from "clsx";
import React from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import type { TabItem } from "~/types/CommonTypes";

const TABS: TabItem[] = [
  { key: "sellable", name: "Sellable Stock", langKey: "sellableStock" },
  {
    key: "non-sellable",
    name: "Non Sellable Stock",
    langKey: "nonSellableStock",
  },
];

interface RackBinTabProps {
  activeTab: string;
  className?: string;
}

const RackBinTab: React.FC<RackBinTabProps> = ({ activeTab, className }) => {
  const appNav = useAppNav();
  const isTheme2 = useTheme() === "theme-2";
  const { isMobile } = useScreenView();

  const handleTabChange = (tab: { key: string; name: string }) => {
    if (tab.key === "sellable") {
      appNav.replace("/dashboard/inventory/rack-bin?type=sellable");
    } else if (tab.key === "non-sellable") {
      appNav.replace("/dashboard/inventory/rack-bin?type=non-sellable");
    }
  };

  return (
    <AppTab
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      // theme-2 carries the scope switch as free-standing pills on a white band
      // pinned under the app header; everywhere else it stays the segmented bar.
      variant={isTheme2 ? "pills" : "tabs"}
      className={clsx(
        isTheme2 &&
          // Sticky, full-bleed white band. With the section tab bar commented
          // out on this page the strip is the first block under the header, so
          // `app-nav-chips-flush` (mobile) / `godown-scope-tabs` (desktop)
          // cancel the page gutter above it.
          "app-nav-chips app-nav-chips-flush godown-scope-tabs",
        className,
      )}
      // Mobile only: the band drops its side padding so the pills scroll edge to
      // edge, and the swiper supplies the leading/trailing inset instead.
      slideOffset={isTheme2 && isMobile ? 16 : 0}
    />
  );
};

export default RackBinTab;
