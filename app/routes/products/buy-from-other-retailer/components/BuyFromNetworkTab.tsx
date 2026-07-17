import { useSearchParams } from "react-router";
import AppTab from "~/components/core/tab/AppTab";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";
import { Box, Search, Tag, Grid, Compass } from "lucide-react";

interface BuyFromNetworkTabProps {
  activeTab?: string;
  className?: string;
  onTabChange?: (tab: TabItem) => void;
}

const getTabs = (): TabItem[] => {
  return [
    { name: "My Inventory", key: "my-inventory", icon: <Box /> },
    {
      name: "Browse Products",
      key: "products",
      langKey: "browseProducts",
      icon: <Search />,
    },
    {
      name: "Browse by Brands",
      key: "brands",
      langKey: "browseByBrand",
      icon: <Tag />,
    },
    {
      name: "Browse by Category",
      key: "categories",
      langKey: "browseByCategory",
      icon: <Grid />,
    },
    // { name: "Discover", key: "discover", icon: <Compass /> },
  ];
};

const KM = DEFAULT_BROWSE_DISTANCE;

const BuyFromNetworkTab = ({
  activeTab = "products",
  className = "",
  onTabChange,
}: BuyFromNetworkTabProps) => {
  const [searchParams] = useSearchParams();
  const rawDistance = searchParams.get("distance") || KM;
  const distance: any = rawDistance === "all" ? "all" : Number(rawDistance);

  const tabs = getTabs();
  const initialTab = tabs.find((t) => t.key === activeTab) ?? tabs[0];
  const appNav = useAppNav();

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "my-inventory") {
      appNav.to("/products/buy-from-other-retailer/products/my", { distance });
    } else if (tab.key === "products") {
      appNav.to("/products/main", { distance });
    } else if (tab.key === "discover") {
      appNav.to("/products/buy-from-other-retailer/retailers", { distance });
    } else if (tab.key === "brands") {
      appNav.to("/products/buy-from-other-retailer/products/brands", {
        distance,
      });
    } else if (tab.key === "categories") {
      appNav.to("/products/buy-from-other-retailer/products/category", {
        distance,
      });
    }
    onTabChange?.(tab);
  };

  return (
    <div className={className}>
      <AppTab
        activeTab={initialTab?.key}
        tabs={tabs}
        onTabChange={handleTabChange}
        className="theme-2-edge-tabs"
      />
    </div>
  );
};

export default BuyFromNetworkTab;
