import { useParams } from "react-router";
import PageAccessService from "~/services/PageAccessService";
import DeliveryRoute from "./components/DeliveryRoute";
import { useState } from "react";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-USERS"]);
}

const tabs: TabItem[] = [
  {
    name: "Delivery Route",
    key: "delivery-route",
  },
  {
    name: "Payment Config",
    key: "payment-config",
  },
];

const SettingsRouteInfo = () => {
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<TabItem>(tabs[0]);

  const onTabChange = (tab: TabItem) => {
    setActiveTab(tab);
  };

  return (
    <div>
      {/* <AppTab
        tabs={tabs}
        activeTab={activeTab.key}
        onTabChange={onTabChange}
        className="tw:mb-4"
        variant="underline"
      /> */}
      <DeliveryRoute userId={id || ""} />{" "}
    </div>
  );
};

export default SettingsRouteInfo;
