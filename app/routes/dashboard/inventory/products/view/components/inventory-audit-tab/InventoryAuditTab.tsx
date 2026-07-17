import React from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";

interface InventoryProductAuditTabProps {
  activeTab: string;
  className?: string;
  dealId: string;
}

const tabItems: TabItem[] = [
  { key: "sales", name: "Sales History", langKey: "salesHistory" },
  { key: "purchase", name: "Purchase History", langKey: "purchaseHistory" },
  { key: "stock-ledger", name: "Stock Ledger", langKey: "stockLedger" },
  { key: "price-changes", name: "Price Changes", langKey: "priceChanges" },
];

const InventoryProductAuditTab: React.FC<InventoryProductAuditTabProps> = ({
  activeTab,
  className = "",
  dealId,
}) => {
  const appNav = useAppNav();

  const onTabChange = (tab: TabItem) => {
    if (tab.key === "sales") {
      appNav.replace(
        `/dashboard/inventory/products/view/${dealId}/sales-history`
      );
    } else if (tab.key === "purchase") {
      appNav.replace(
        `/dashboard/inventory/products/view/${dealId}/purchase-history`
      );
    } else if (tab.key === "stock-ledger") {
      appNav.replace(
        `/dashboard/inventory/products/view/${dealId}/stock-ledger`
      );
    } else if (tab.key === "price-changes") {
      appNav.replace(
        `/dashboard/inventory/products/view/${dealId}/price-changes`
      );
    }
  };

  return (
    <AppTab
      tabs={tabItems}
      activeTab={activeTab}
      onTabChange={onTabChange}
      className={className}
      variant="underline"
    />
  );
};

export default InventoryProductAuditTab;
