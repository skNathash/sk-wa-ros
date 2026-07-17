import AppHeader from "~/components/core/header/AppHeader";
// import Summary from "./components/Summary";
import { Outlet, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import PaylaterService from "~/services/PaylaterService";
import AuthService from "~/services/AuthService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import PaylaterRequestCard from "~/shared/accounts/components/paylater/paylater-req-card/PaylaterRequestCard";
import PageDescription from "~/components/core/page-description/PageDescription";
import { useTranslation } from "react-i18next";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";

const tabs: TabItem[] = [
  {
    name: "Analytics",
    key: "analytics",
    langKey: "analytics",
    icon: "chart-no-axes-column",
  },
  {
    name: "B2C Wallets",
    key: "b2c-wallets",
    langKey: "b2cWallets",
    icon: "indian-rupee",
  },
  {
    name: "B2B Wallets",
    key: "b2b-wallets",
    langKey: "b2bWallets",
    icon: "building-2",
  },
  {
    name: "Statements",
    key: "statements",
    langKey: "statements",
    icon: "file-text",
  },
  {
    name: "Pay Later Orders",
    key: "orders",
    langKey: "payLaterOrders",
    icon: "list-ordered",
  },
  {
    name: "My Paylater",
    key: "my-paylater",
    langKey: "myPaylater",
    icon: "credit-card",
  },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
    langKey: "dashboard",
  },
  {
    label: "PayLater Management",
    langKey: "paylaterManagement",
  },
];

const AccountsLayout = () => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "analytics";

  const [b2cCount, setB2cCount] = useState<number | null>(null);
  const [b2bCount, setB2bCount] = useState<number | null>(null);

  // Attach counts to tabs so AppTab can render them
  const tabsWithCounts: TabItem[] = tabs.map((t) => {
    if (t.key === "b2c-wallets") return { ...t, count: b2cCount ?? undefined };
    if (t.key === "b2b-wallets") return { ...t, count: b2bCount ?? undefined };
    return t;
  });

  const isManpower = AuthService.isManpowerLoggedIn();
  const visibleTabs = isManpower
    ? tabsWithCounts.filter((t) => t.key !== "my-paylater")
    : tabsWithCounts;

  const normalizedActiveTab = activeTab;

  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      try {
        const respB2c: any = await PaylaterService.getRequestCount({
          filter: { status: "Pending", "userInfo.type": "customer" },
          isMyNetwork: true,
        });
        const c = respB2c?.data?.data?.count ?? 0;
        if (mounted) setB2cCount(c);
      } catch (e) {
        if (mounted) setB2cCount(0);
      }

      try {
        const respB2b: any = await PaylaterService.getRequestCount({
          filter: { status: "Pending", "userInfo.type": "franchise" },
          isMyNetwork: true,
        });
        const c = respB2b?.data?.data?.count ?? 0;
        if (mounted) setB2bCount(c);
      } catch (e) {
        if (mounted) setB2bCount(0);
      }
    };

    // Initial fetch
    fetchCounts();

    // Poll every 60 seconds
    const id = setInterval(fetchCounts, 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "analytics") {
      appNav.to(`/dashboard/paylater/analytics`, {
        tab: tab.key,
      });
    } else if (tab.key === "orders") {
      appNav.to(`/dashboard/paylater/orders`, {
        tab: tab.key,
      });
    } else if (tab.key === "statements") {
      appNav.to(`/dashboard/paylater/statements`, {
        tab: tab.key,
      });
    } else if (tab.key === "b2c-wallets") {
      appNav.to(`/dashboard/paylater/wallets/b2c`, {
        tab: tab.key,
      });
    } else if (tab.key === "b2b-wallets") {
      appNav.to(`/dashboard/paylater/wallets/b2b`, {
        tab: tab.key,
      });
    } else if (tab.key === "my-paylater") {
      appNav.to(`/dashboard/paylater/my-paylater`, {
        tab: tab.key,
      });
    } else {
      appNav.to(`/dashboard/paylater/analytics?tab=${tab.key}`);
    }
  };

  return (
    <>
      <AppHeader title={t("paylater")} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            sectionKey="business"
            activeTab="paylater"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="paylater"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
          <div className="tw:mb-4">
            <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
            <PageDescription description="paylaterManagement" />
          </div>

          <PaylaterRequestCard />
          <AppTab
            activeTab={normalizedActiveTab}
            tabs={visibleTabs}
            onTabChange={handleTabChange}
            className="tw:mb-4"
          />
          <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountsLayout;
