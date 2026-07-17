import React from "react";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import { useTranslation } from "react-i18next";

interface Props {
  activeTab: string;
  className?: string;
}

const OrderTabs: React.FC<Props> = ({ activeTab, className }) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const tabItems: TabItem[] = [
    { key: "analytics", name: t("orderAnalytics") },
    { key: "all-orders", name: t("allOrders") },
    { key: "performance", name: t("performance") },
  ];

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "analytics") {
      appNav.to(`/dashboard/orders/analytics`);
    } else if (tab.key === "all-orders") {
      appNav.to(`/dashboard/orders/list`);
    } else if (tab.key === "performance") {
      appNav.to(`/dashboard/orders/performance`);
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

export type OrderTabsType =
  | "b2b-orders"
  | "b2c-orders"
  | "coinstore-orders"
  | "my-orders"
  | "receive-order"
  | "order-requests"
  | "unconfirmed-orders"
  | "payment-approval"
  | "pending-settlement";

export default OrderTabs;
