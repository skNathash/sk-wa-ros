import { useMemo } from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import { Tag, Users, Layers, Clock, Package, Gift } from "lucide-react";
import type { TabItem } from "~/types/CommonTypes";

const ManagePriceTabs = ({
  activeTab,
  className,
}: {
  activeTab:
    | "b2c"
    | "b2b"
    | "priceSlab"
    | "history"
    | "caseConfig"
    | "b2bScheme";
  className?: string;
}) => {
  const appNav = useAppNav();

  const mainTabs: TabItem[] = [
    {
      name: "B2C Pricing",
      key: "b2c_main",
      icon: <Tag />,
    },
    {
      name: "B2B Pricing",
      key: "b2b_main",
      icon: <Users />,
    },
    {
      name: "Pricing History",
      key: "history",
      langKey: "pricingHistory",
      icon: <Clock />,
    },
  ];

  const b2bSubTabs: TabItem[] = [
    {
      name: "B2B Selling Price",
      key: "b2b",
      langKey: "b2bSellingPrice",
      icon: <Users />,
    },
    {
      name: "B2B Scheme",
      key: "b2bScheme",
      icon: <Gift />,
    },
    {
      name: "B2B Price Slab",
      key: "priceSlab",
      icon: <Layers />,
    },
  ];

  const activeMainTab = useMemo(() => {
    if (activeTab === "b2c") return "b2c_main";
    if (["b2b", "b2bScheme", "priceSlab", "caseConfig"].includes(activeTab)) {
      return "b2b_main";
    }
    if (activeTab === "history") return "history";
    return "b2c_main";
  }, [activeTab]);

  const onTabChange = (tab: TabItem) => {
    if (tab.key === "b2c_main") {
      appNav.to(`/configs/rsp?type=customer`);
    } else if (tab.key === "b2b_main") {
      appNav.to(`/configs/rsp?type=network`);
    } else if (tab.key === "b2b") {
      appNav.to(`/configs/rsp?type=network`);
    } else if (tab.key === "priceSlab") {
      appNav.to(`/configs/price-slab`);
    } else if (tab.key === "history") {
      appNav.to(`/configs/rsp/history`);
    } else if (tab.key === "b2bScheme") {
      appNav.to(`/configs/schemes`);
    } else if (tab.key === "caseConfig") {
      appNav.to(`/dashboard/inventory/cases`);
    }
  };

  return (
    <div className={className}>
      <AppTab
        tabs={mainTabs}
        activeTab={activeMainTab}
        onTabChange={onTabChange}
        className="tw:mb-4"
      />
      {activeMainTab === "b2b_main" && (
        <AppTab
          tabs={b2bSubTabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          variant="underline"
        />
      )}
    </div>
  );
};

export default ManagePriceTabs;
