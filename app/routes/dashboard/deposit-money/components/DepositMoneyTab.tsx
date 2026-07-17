import { useState } from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";

interface DepositMoneyTabProps {
  activeTab?: string;
  className?: string;
}

const DepositMoneyTab = ({
  activeTab = "create",
  className = "",
}: DepositMoneyTabProps) => {
  const appNav = useAppNav();

  const [currentTab, setCurrentTab] = useState(activeTab);

  const tabs: TabItem[] = [
    {
      name: "Create",
      key: "create",
      langKey: "depositMoney",
    },
    {
      name: "Transactions",
      key: "transactions",
      langKey: "transactions",
    },
  ];

  const handleTabChange = (tab: TabItem) => {
    setCurrentTab(tab.key);
    if (tab.key === "create") {
      appNav.to(`/dashboard/deposit-money/create`);
    } else if (tab.key === "transactions") {
      appNav.to(`/dashboard/deposit-money/list`, { tab: tab.key });
    }
  };

  return (
    <AppTab
      activeTab={currentTab}
      tabs={tabs}
      onTabChange={handleTabChange}
      className={className}
    />
  );
};

export default DepositMoneyTab;
