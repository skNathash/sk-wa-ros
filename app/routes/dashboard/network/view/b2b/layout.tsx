import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import FranchiseService from "~/services/FranchiseService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";

import {
  CreditCard,
  FileText,
  IdCard,
  IndianRupee,
  ListOrdered,
  Settings,
  MessagesSquare,
} from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import PageAccessService from "~/services/PageAccessService";
import type { TabItem } from "~/types/CommonTypes";
import BasicInfo from "./components/BasicInfo";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-USERS"]);
}

const tabs: TabItem[] = [
  { name: "Orders", key: "orders", icon: <ListOrdered />, langKey: "orders" },
  // {
  //   name: "Payments",
  //   key: "payments",
  //   icon: <IndianRupee />,
  //   langKey: "payments",
  // },
  {
    name: "Statement",
    key: "statement",
    icon: <FileText />,
    langKey: "statement",
  },
  {
    name: "Paylater",
    key: "paylater",
    icon: <CreditCard />,
    langKey: "paylater",
  },
  // { name: "Settings", key: "settings", icon: <Settings /> },
  { name: "KYC", key: "kyc", icon: <IdCard />, langKey: "kyc" },
  {
    key: "notification-logs",
    name: "Notification Logs",
    icon: <MessagesSquare />,
    langKey: "notificationLogs",
  },
];

const getActiveTab = (location: any) => {
  const path = location.pathname.split("/").pop();
  if (path === "orders") {
    return "orders";
  } else if (path === "settings") {
    return "settings";
  } else if (path === "payments") {
    return "payments";
  } else if (path === "statement") {
    return "statement";
  } else if (path === "paylater") {
    return "paylater";
  } else if (path === "kyc") {
    return "kyc";
  } else if (path === "notification-logs") {
    return "notification-logs";
  }
  return "orders";
};

export default function B2BView() {
  const appNav = useAppNav();
  const { t } = useTranslation(["common", "menu"]);

  const { id } = useParams<{ id: string }>();

  const [franchise, setFranchise] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const activeTab = getActiveTab(location);

  useEffect(() => {
    if (id) loadFranchise(id);
  }, [id]);

  const loadFranchise = async (fid: string) => {
    setLoading(true);
    try {
      const resp = await FranchiseService.getFranchise(fid);
      if (resp?.statusCode === 200 && resp.data) {
        setFranchise(resp.data?.data);
      } else {
        setFranchise(null);
      }
    } catch (err) {
      console.error("Error loading franchise:", err);
      setFranchise(null);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbData = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    {
      label: "Customer Management",
      redirect: {
        path: "/dashboard/network/management/b2b-retailers?tab=b2b-retailers",
      },
    },
    { label: "Retailer Details", redirect: { path: "#" } },
  ];

  const onTabChange = (tab: TabItem) => {
    if (tab.key === "orders") {
      appNav.to(`/dashboard/network/view/b2b/${id}`);
    } else if (tab.key === "settings") {
      appNav.to(`/dashboard/network/view/b2b/${id}/settings`);
    } else if (tab.key === "payments") {
      appNav.to(`/dashboard/network/view/b2b/${id}/payments`);
    } else if (tab.key === "statement") {
      appNav.to(`/dashboard/network/view/b2b/${id}/statement`);
    } else if (tab.key === "paylater") {
      appNav.to(`/dashboard/network/view/b2b/${id}/paylater`);
    } else if (tab.key === "kyc") {
      appNav.to(`/dashboard/network/view/b2b/${id}/kyc`);
    } else if (tab.key === "notification-logs") {
      appNav.to(`/dashboard/network/view/b2b/${id}/notification-logs`);
    }
  };

  return (
    <>
      <AppHeader title="Retailer Details" />

      <div className="app-page page-bg page-padding">
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
              <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:mb-4">
                <AppBreadcrumbs data={breadcrumbData} />
              </div>

              {loading && (
                <div className="tw:flex tw:justify-center tw:py-8">
                  <AppSpinner />
                </div>
              )}

              {!loading && !franchise && (
                <AppCard>
                  <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-12 tw:text-gray-500">
                    <div>Retailer not found.</div>
                  </div>
                </AppCard>
              )}

              {!loading && franchise && (
                <div className="tw:flex tw:flex-col tw:gap-4">
                  {/* Left column - 25% on desktop, full width mobile */}
                  <div className="tw:w-full tw:flex tw:flex-col tw:gap-4">
                    <BasicInfo franchise={franchise} />
                    {/* <AccountStatus franchise={franchise} /> */}
                    {/* <QuickStats franchise={franchise} />
                    <Paylater franchise={franchise} /> */}
                  </div>

                  {/* Right column - 75% on desktop */}
                  <div className="tw:w-full">
                    <AppTab
                      tabs={tabs}
                      activeTab={activeTab || "orders"}
                      onTabChange={onTabChange}
                      className="tw:mb-4"
                    />
                    <Outlet />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
