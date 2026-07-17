import React from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";

interface TabItem {
  key: string;
  name: string;
  icon?: string;
}

interface InventoryProductTabProps {
  activeTab: string;
  className?: string;
  dealId: string;
}

const tabItems: TabItem[] = [
  { key: "overview", name: "Overview", icon: "layout-dashboard" },
  { key: "analytics", name: "Analytics", icon: "bar-chart-3" },
  { key: "vendors", name: "Vendors & Purchasing", icon: "indian-rupee" },
  { key: "audit", name: "Audit History", icon: "history" },
];

const InventoryProductTab: React.FC<InventoryProductTabProps> = ({
  activeTab,
  className = "",
  dealId,
}) => {
  const appNav = useAppNav();

  const onTabChange = (tab: TabItem) => {
    if (tab.key == "overview") {
      appNav.to(`/dashboard/inventory/products/view/${dealId}`);
    } else if (tab.key == "analytics") {
      appNav.to(`/dashboard/inventory/products/view/${dealId}/analytics`);
    } else if (tab.key == "vendors") {
      appNav.to(`/dashboard/inventory/products/view/${dealId}/vendors`);
    } else if (tab.key == "audit") {
      appNav.to(`/dashboard/inventory/products/view/${dealId}/audit`);
    }
  };

  return (
    <AppTab
      tabs={tabItems}
      activeTab={activeTab}
      onTabChange={onTabChange}
      className={className}
    />
  );
};

export default InventoryProductTab;
