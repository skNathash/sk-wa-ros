import React from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import { useSearchParams } from "react-router";
import type { TabItem } from "~/types/CommonTypes";

interface PlatformFeeTabsProps {
  activeTab: string;
  className?: string;
}

const PlatformFeeTabs: React.FC<PlatformFeeTabsProps> = ({
  activeTab,
  className,
}) => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const tabs: TabItem[] = [
    {
      name: "Benefits",
      key: "benefits",
      langKey: "benefits",
    },
    {
      name: "Plans",
      key: "available-plans",
      langKey: "plans",
    },
    {
      name: "Statement",
      key: "history",
      langKey: "statement",
    },
  ];

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "available-plans") {
      appNav.to("/dashboard/accounts/platform-fee", {
        tab: "commission-invoices",
        subtab: tab.key,
        dateFrom,
        dateTo,
      });
    } else if (tab.key === "history") {
      appNav.to("/dashboard/accounts/platform-fee/statement", {
        tab: "commission-invoices",
        subtab: tab.key,
        dateFrom,
        dateTo,
      });
    } else if (tab.key === "benefits") {
      appNav.to("/dashboard/accounts/platform-fee/benefits", {
        tab: "commission-invoices",
        subtab: tab.key,
        dateFrom,
        dateTo,
      });
    }
  };

  return (
    <AppTab
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      className={className}
    />
  );
};

export default PlatformFeeTabs;
