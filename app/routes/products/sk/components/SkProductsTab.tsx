import { Grid, Store, Tag } from "lucide-react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";

interface SkProductsTabProps {
  activeTab?: string;
  className?: string;
  onTabChange?: (tab: TabItem) => void;
}

const getTabs = (): TabItem[] => {
  return [
    {
      name: "Buy From SK",
      key: "products",
      langKey: "buyFromSK",
      icon: <Store />,
    },
    {
      name: "Browse SK Brands",
      key: "brands",
      langKey: "browseSKBrands",
      icon: <Tag />,
    },
    {
      name: "Browse SK Categories",
      key: "categories",
      langKey: "browseSKCategories",
      icon: <Grid />,
    },
  ];
};

const SkProductsTab = ({
  activeTab = "products",
  className = "",
  onTabChange,
}: SkProductsTabProps) => {
  const tabs = getTabs();
  const initialTab = tabs.find((t) => t.key === activeTab) ?? tabs[0];
  const appNav = useAppNav();

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "products") {
      appNav.to("/products/sk");
    } else if (tab.key === "brands") {
      appNav.to("/products/sk/brands");
    } else if (tab.key === "categories") {
      appNav.to("/products/sk/category");
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

export default SkProductsTab;
