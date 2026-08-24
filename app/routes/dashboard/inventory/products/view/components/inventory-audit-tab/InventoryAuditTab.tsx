import React, { useMemo } from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import type { TabItem } from "~/types/CommonTypes";

interface InventoryProductAuditTabProps {
  activeTab: string;
  className?: string;
  dealId: string;
}

const tabItems: TabItem[] = [
  // { key: "sales", name: "Sales History", langKey: "salesHistory" },
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
  const isTheme2 = useTheme() === "theme-2";

  // theme-2 carries purchase history on its own "Purchasing" tab (see the
  // product-view layout), so it is dropped from here to avoid two ways in.
  const visibleTabs = useMemo(
    () =>
      isTheme2 ? tabItems.filter((tab) => tab.key !== "purchase") : tabItems,
    [isTheme2],
  );

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

  // Purchase history keeps rendering this bar, but in theme-2 it reaches the
  // page from its own top-level tab — a sub-nav with nothing selected in it
  // would only mislead, so it is dropped.
  if (!visibleTabs.some((tab) => tab.key === activeTab)) return null;

  return (
    <AppTab
      tabs={visibleTabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      className={className}
      variant="underline"
    />
  );
};

export default InventoryProductAuditTab;
