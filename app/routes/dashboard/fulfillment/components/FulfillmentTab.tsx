import React from "react";
import useAppNav from "~/hooks/useAppNav";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";

interface FulfillmentTabProps {
  activeTab: string;
}

const FulfillmentTab: React.FC<FulfillmentTabProps> = ({ activeTab }) => {
  const { to } = useAppNav();

  const tabs: TabItem[] = [
    { key: "b2c-b2b", name: "B2C & B2B Order" },
    { key: "vendor-return", name: "Vendor Return" },
  ];

  const handleTabChange = (tab: TabItem) => {
    switch (tab.key) {
      case "b2c-b2b":
        to("/dashboard/fulfillment/list");
        break;
      case "vendor-return":
        to("/dashboard/fulfillment/vendor-return");
        break;
      default:
        to("/dashboard/fulfillment/list");
    }
  };

  return (
    <AppTab
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      className="tw:mb-4"
    />
  );
};

export default FulfillmentTab;
