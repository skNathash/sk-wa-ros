import React from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
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
      variant="tabs"
      className={className}
    />
  );
};

export default RackBinTab;
