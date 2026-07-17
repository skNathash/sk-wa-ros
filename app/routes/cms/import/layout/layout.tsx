import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import { Outlet, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import Barcode from "./components/Barcode";

const tabs: TabItem[] = [
  {
    name: "Manual",
    key: "manual",
    icon: "upload",
  },
  {
    name: "Copy Paste",
    key: "copy-paste",
    icon: "upload",
  },
  {
    name: "Upload",
    key: "upload",
    icon: "upload",
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
    redirect: {
      path: "/dashboard/cms",
    },
  },
  {
    label: "Import Management",
  },
];

const ImportLayout = () => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "manual";

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "manual") {
      appNav.to(`/cms/import/manual`, { tab: tab.key });
    } else if (tab.key === "copy-paste") {
      appNav.to(`/cms/import/copy-paste`, { tab: tab.key });
    } else if (tab.key === "upload") {
      appNav.to(`/cms/import/upload`, { tab: tab.key });
    } else {
      appNav.to(`/cms/import/manual?tab=${tab.key}`);
    }
  };

  return (
    <>
      <AppHeader title="Import Management" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <div className="tw:text-sm tw:text-gray-500 tw:mb-4">
            Import deals, categories, and brands for the website.
          </div>

          <Barcode />

          {/* Add a Summary component here if needed */}
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

export default ImportLayout;
