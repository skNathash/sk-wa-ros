import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import { Outlet, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import Summary from "./components/Summary";

const tabs: TabItem[] = [
  {
    name: "Deal Management",
    key: "deal",
    icon: "chart-no-axes-column",
  },
  {
    name: "Category Management",
    key: "category",
    icon: "list-ordered",
  },
  {
    name: "Brand Management",
    key: "brand",
    icon: "file-text",
  },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Content Management System",
  },
];

const AccountsLayout = () => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "deal";

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "deal") {
      appNav.to(`/dashboard/cms/deal`, {
        tab: tab.key,
      });
    } else if (tab.key === "category") {
      appNav.to(`/dashboard/cms/category`, {
        tab: tab.key,
      });
    } else if (tab.key === "brand") {
      appNav.to(`/dashboard/cms/brand`, {
        tab: tab.key,
      });
    } else {
      appNav.to(`/dashboard/cms/deal?tab=${tab.key}`);
    }
  };

  return (
    <>
      <AppHeader title="Content Management System" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <div className="tw:text-sm tw:text-gray-500 tw:mb-4">
            Manage deals, categories, and brands for the website.
          </div>
          <Summary />
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

export default AccountsLayout;
