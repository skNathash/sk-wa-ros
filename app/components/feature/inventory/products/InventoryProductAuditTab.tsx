import React from "react";
import { useTranslation } from "react-i18next";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";

interface InventoryProductAuditTabProps {
  activeTab: string;
  className?: string;
  dealId: string;
}

const InventoryProductAuditTab: React.FC<InventoryProductAuditTabProps> = ({
  activeTab,
  className = "",
  dealId,
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const tabItems: TabItem[] = [
    { key: "sales", name: t("salesHistory") },
    { key: "purchase", name: t("purchaseHistory") },
    { key: "stock-ledger", name: t("stockLedger") },
    { key: "price", name: t("priceChanges") },
  ];

  const onTabChange = (tab: TabItem) => {
    if (tab.key === "sales") {
      appNav.replace(`/dashboard/inventory/products/sales-history/${dealId}`);
    } else if (tab.key === "purchase") {
      appNav.replace(
        `/dashboard/inventory/products/purchase-history/${dealId}`
      );
    } else if (tab.key === "stock-ledger") {
      appNav.replace(`/dashboard/inventory/products/stock-ledger/${dealId}`);
    } else if (tab.key === "price") {
      appNav.replace(`/dashboard/inventory/products/price-changes/${dealId}`);
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

export default InventoryProductAuditTab;
