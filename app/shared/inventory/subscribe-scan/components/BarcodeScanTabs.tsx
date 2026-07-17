import { ScanLine, ScanBarcode, History } from "lucide-react";
import React from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";

export type BarcodeScanTabKey = "single" | "bulk" | "items";

interface BarcodeScanTabsProps {
  activeTab: BarcodeScanTabKey;
  className?: string;
}

const tabItems: TabItem[] = [
  {
    key: "single",
    name: "Single Scan",
    icon: <ScanLine size={18} />,
  },
  {
    key: "bulk",
    name: "Bulk Scan",
    icon: <ScanBarcode size={18} />,
  },
  {
    key: "items",
    name: "Scan Results",
    icon: <History size={18} />,
  },
];

const routeByKey: Record<BarcodeScanTabKey, string> = {
  single: "/dashboard/inventory/barcode-scan",
  bulk: "/dashboard/inventory/barcode-scan-bulk",
  items: "/dashboard/inventory/barcode-scan-bulk-items",
};

const BarcodeScanTabs: React.FC<BarcodeScanTabsProps> = ({
  activeTab,
  className,
}) => {
  const appNav = useAppNav();

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === activeTab) return;
    const path = routeByKey[tab.key as BarcodeScanTabKey];
    if (path) appNav.to(path);
  };

  return (
    <AppTab
      tabs={tabItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      variant="tabs"
      className={className}
    />
  );
};

export default BarcodeScanTabs;
