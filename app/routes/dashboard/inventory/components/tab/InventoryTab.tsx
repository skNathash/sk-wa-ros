import {
  CircleSlash,
  ClipboardList,
  LayoutGrid,
  Package,
  Settings,
  Tags,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";

interface InventoryTabProps {
  activeTab: string;
  className?: string;
}

const InventoryTab: React.FC<InventoryTabProps> = ({
  activeTab,
  className,
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const tabItems: TabItem[] = [
    {
      key: "products",
      name: "My Store Catalog",
      langKey: "myStoreCatalog",
      icon: <Package size={18} />,
    },
    // {
    //   key: "cases",
    //   name: "Package Type Config",
    //   langKey: "caseInnerCase",
    //   icon: <Layers size={18} />,
    // },
    {
      key: "browse-by-brand",
      name: "Browse by Brand",
      langKey: "browseByBrand",
      icon: <Tags size={18} />,
    },
    {
      key: "browse-category",
      name: t("browseByCategory"),
      langKey: "browseByCategory",
      icon: <LayoutGrid size={18} />,
    },
    {
      key: "bulk-update",
      name: "Bulk Update",
      icon: <Settings size={18} />,
    },
    // { key: "stock-alerts", name: "Stock Alerts" },
    // { key: "purchase-basket", name: "Purchase Basket" },
    // { key: "vendor-returns", name: "Vendor Returns" },
    {
      key: "stock-master",
      name: t("stockMaster"),
      icon: <ClipboardList size={18} />,
    },
    {
      key: "inactive-products",
      name: "Inactive Items",
      langKey: "inactiveItems",
      icon: <CircleSlash size={18} />,
    },
  ];

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "stock-alerts") {
      appNav.to(`/dashboard/inventory/stock-alerts`);
    } else if (tab.key === "purchase-basket") {
      appNav.to(`/dashboard/inventory/purchase-basket`);
    } else if (tab.key === "subscribe-history") {
      appNav.to(`/dashboard/inventory/subscribe/approval-history/products`);
    } else if (tab.key === "stock-master") {
      appNav.to(`/dashboard/inventory/stock-master/list`);
    } else if (tab.key === "browse-category") {
      appNav.to(`/dashboard/inventory/browse-category`);
    } else if (tab.key === "browse-by-brand") {
      appNav.to(`/dashboard/inventory/browse`);
    } else if (tab.key === "inactive-products") {
      appNav.to(`/dashboard/inventory/products/list?inactive=true`);
    } else if (tab.key === "cases") {
      appNav.to(`/dashboard/inventory/cases`);
    } else if (tab.key === "bulk-update") {
      appNav.to(`/dashboard/inventory/bulk-update`);
    } else {
      appNav.to(`/dashboard/inventory/products/list`);
    }
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
export default InventoryTab;
