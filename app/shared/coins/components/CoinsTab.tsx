import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";
import { ListOrdered, Settings, Sparkles } from "lucide-react";

interface CoinsTabProps {
  activeTab?: string;
  className?: string;
}

const tabs: TabItem[] = [
  { key: "config", name: "Config", langKey: "config", icon: <Settings /> },
  {
    key: "transactions",
    name: "Transactions",
    langKey: "transactions",
    icon: <ListOrdered />,
  },
  {
    key: "coin-store",
    name: "KingCoin Store",
    langKey: "kingCoinStore",
    icon: <Sparkles />,
  },
];

const CoinsTab = ({ activeTab = "config", className = "" }: CoinsTabProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const initialTab = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "coin-store") {
      appNav.to(`/products/coin-store-deals`);
    } else {
      appNav.to(`/dashboard/points/list`, { tab: tab.key });
    }
  };

  return (
    <div className={className}>
      <AppTab
        activeTab={initialTab?.key}
        tabs={tabs}
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default CoinsTab;
