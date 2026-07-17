import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import type { TabItem } from "~/types/CommonTypes";

interface BuyFromNetworkTabProps {
  activeTab?: string;
  className?: string;
  onTabChange?: (tab: TabItem) => void;
}

const getTabs = (): TabItem[] => {
  const baseTabs: TabItem[] = [];

  const isSkBuyer = AuthService.isSkBuyer();

  // Show "Buy From SK" only if not skBuyer
  if (!isSkBuyer) {
    baseTabs.push({
      name: "Buy From SK",
      key: "buy-from-sk",
      langKey: "buyFromSk",
    });
  }

  if (isSkBuyer) {
    baseTabs.push({
      name: "Buy From SK Seller",
      key: "buy-from-sk-seller",
      langKey: "buyFromSkSeller",
    });
  }

  baseTabs.push({
    name: "Buy From Network",
    key: "buy-from-network",
    langKey: "buyFromNetwork",
  });

  return baseTabs;
};

const BuyFromNetworkTab = ({
  activeTab = "buy-from-sk",
  className = "",
  onTabChange,
}: BuyFromNetworkTabProps) => {
  const tabs = getTabs();
  const initialTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
  const appNav = useAppNav();

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "buy-from-network") {
      appNav.to("/products/buy-from-other-retailer/products");
    } else if (tab.key === "buy-from-sk" || tab.key === "buy-from-sk-seller") {
      appNav.to("/products/main");
    }
    onTabChange?.(tab);
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

export default BuyFromNetworkTab;
