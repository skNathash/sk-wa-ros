import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";
import Overview from "./components/Overview";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import PageLoader from "~/components/core/page-loader/PageLoader";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { TabItem } from "~/types/CommonTypes";
import { getDetails } from "./helper";

import type { Customer } from "./components/Overview";
import PageAccessService from "~/services/PageAccessService";
import type { Route } from "./+types/layout";
import { useRevalidator } from "react-router";
import {
  CreditCard,
  FileText,
  History,
  IdCard,
  IndianRupee,
  LayoutDashboard,
  MessagesSquare,
  Star,
} from "lucide-react";

const breadcrumbs = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Customer Management",
    redirect: {
      path: "/dashboard/network/management/b2c-customers?tab=b2c-customers",
    },
  },
  { label: "B2C Details" },
];

export async function clientLoader({ params }: { params: { id: string } }) {
  if (PageAccessService.canAccessPage(["NETWORK.VIEW-USERS"])) {
    return;
  }
  const details = await getDetails(params.id);
  return details;
}

const tabItems: TabItem[] = [
  {
    key: "overview",
    name: "Overview",
    icon: <LayoutDashboard />,
    langKey: "overview",
  },
  {
    key: "purchase-history",
    name: "Purchase History",
    icon: <History />,
    langKey: "purchaseHistory",
  },
  {
    key: "loyalty-program",
    name: "Loyalty Program",
    icon: <Star />,
    langKey: "kingCoins",
  },
  // { key: "payments", name: "Payments", icon: <IndianRupee /> },
  {
    key: "statement",
    name: "Statement",
    icon: <FileText />,
    langKey: "statement",
  },
  {
    key: "paylater",
    name: "Paylater",
    icon: <CreditCard />,
    langKey: "paylater",
  },
  { key: "kyc", name: "KYC", icon: <IdCard />, langKey: "kyc" },
  {
    key: "notification-logs",
    name: "Notification Logs",
    icon: <MessagesSquare />,
    langKey: "notificationLogs",
  },
];

const B2CNetworkLayout = ({ loaderData }: Route.ComponentProps) => {
  const customer = loaderData as Customer | undefined;
  const appNav = useAppNav();
  const location = useLocation();
  const revalidator = useRevalidator();
  const { t } = useTranslation(["common", "menu"]);

  let activeTab =
    tabItems.find((item) => item.key === location.pathname.split("/").pop())
      ?.key || "overview";

  const onTabChange = (tab: TabItem) => {
    const basePath = `/dashboard/network/view/b2c/${customer?._id}`;
    if (tab.key === "overview") {
      appNav.to(basePath);
    } else if (tab.key === "purchase-history") {
      appNav.to(`${basePath}/purchase-history`);
    } else if (tab.key === "loyalty-program") {
      appNav.to(`${basePath}/loyalty-program`);
    } else if (tab.key === "payments") {
      appNav.to(`${basePath}/payments`);
    } else if (tab.key === "paylater") {
      appNav.to(`${basePath}/paylater`);
    } else if (tab.key === "kyc") {
      appNav.to(`${basePath}/kyc`);
    } else if (tab.key === "statement") {
      appNav.to(`${basePath}/statement`);
    } else if (tab.key === "notification-logs") {
      appNav.to(`${basePath}/notification-logs`);
    }
  };

  return (
    <>
      <AppHeader title="B2C Network Details" />
      <div className="page-bg app-page page-padding">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            sectionKey="business"
            activeTab="customers"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="customers"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="theme-2-mobile-only tw:h-4" />
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

              {!customer ? (
                <PageLoader />
              ) : !customer._id ? (
                <NoData />
              ) : (
                <>
                  <Overview
                    customer={customer}
                    onRefresh={() => revalidator.revalidate()}
                  />
                  <AppTab
                    tabs={tabItems}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    className="tw:mb-4"
                  />
                  <Outlet />
                </>
              )}
            </div>
          </div>
        </div>
        {/* <BlockedQtyListModal
          show={blockedQtyModal.show}
          dealId={blockedQtyModal.data?.dealId}
          callback={() => setBlockedQtyModal({ show: false, data: null })}
        /> */}
      </div>
    </>
  );
};

export default B2CNetworkLayout;
