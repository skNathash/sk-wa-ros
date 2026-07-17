import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import { Outlet, useLocation } from "react-router";
import type { TabItem } from "~/types/CommonTypes";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";

const breadcrumbs = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  { label: "Settings" },
];

const tabItems: TabItem[] = [
  { key: "delivery-slot", name: "Delivery Slot", icon: "layout-dashboard" },
  { key: "payment-config", name: "Payment Config", icon: "indian-rupee" },
  { key: "delivery-charge", name: "Delivery Charge", icon: "history" },
];

const getActiveTab = (location: any) => {
  const path = location.pathname.split("/").pop();
  if (path == "delivery-slot") {
    return "delivery-slot";
  } else if (path == "payment-config") {
    return "payment-config";
  } else if (path == "delivery-charge") {
    return "delivery-charge";
  }
};

const Settings = () => {
  const appNav = useAppNav();
  const location = useLocation();

  const activeTab = getActiveTab(location) || "delivery-slot";

  const onTabChange = (tab: TabItem) => {
    if (tab.key == "delivery-slot") {
      appNav.to("/configs/settings/delivery-slot");
    } else if (tab.key == "payment-config") {
      appNav.to("/configs/settings/payment-config");
    } else if (tab.key == "delivery-charge") {
      appNav.to("/configs/settings/delivery-charge");
    }
  };

  return (
    <>
      <AppHeader title="Settings" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />

          <AppTab
            tabs={tabItems}
            activeTab={activeTab}
            onTabChange={onTabChange}
            className="tw:mb-4"
          />

          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Settings;
