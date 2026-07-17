import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import { Outlet, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import PageDescription from "~/components/core/page-description/PageDescription";

const tabs: TabItem[] = [
  {
    name: "Dispatch",
    key: "dispatch",
    icon: "truck",
    langKey: "dispatch",
  },
  {
    name: "In Transit",
    key: "in-transit",
    icon: "route",
    langKey: "inTransit",
  },
  {
    name: "COD Reconciliation",
    key: "cod-reconciliation",
    icon: "indian-rupee",
    langKey: "codReconciliation",
  },
  // {
  //   name: "Analytics",
  //   key: "analytics",
  //   icon: "chart-no-axes-column",
  // },
  // {
  //   name: "Personnel",
  //   key: "personnel",
  //   icon: "user",
  // },
  // {
  //   name: "Agencies",
  //   key: "agencies",
  //   icon: "building-2",
  // },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Delivery Management",
    langKey: "deliveryManagement",
  },
];

const DeliveryLayout = () => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dispatch";

  const handleTabChange = (tab: TabItem) => {
    switch (tab.key) {
      case "dispatch":
        appNav.to(`/dashboard/delivery/dispatch`, { tab: tab.key });
        break;
      case "in-transit":
        appNav.to(`/dashboard/delivery/in-transit`, { tab: tab.key });
        break;
      case "cod-reconciliation":
        appNav.to(`/dashboard/delivery/cod-reconciliation`, { tab: tab.key });
        break;
      case "analytics":
        appNav.to(`/dashboard/delivery/analytics`, { tab: tab.key });
        break;
      case "personnel":
        appNav.to(`/dashboard/delivery/personnel`, { tab: tab.key });
        break;
      case "agencies":
        appNav.to(`/dashboard/delivery/agencies`, { tab: tab.key });
        break;
      default:
        appNav.to(`/dashboard/delivery/dispatch?tab=${tab.key}`);
    }
  };

  return (
    <>
      <AppHeader title="Delivery Management" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <PageDescription description="lastMileDelivery" className="tw:mb-4" />

          <AppTab
            activeTab={activeTab}
            tabs={tabs}
            onTabChange={handleTabChange}
            className="tw:mb-4"
          />
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default DeliveryLayout;
