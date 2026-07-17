import { Building2, Plus, Store, UserPlus, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";

// Tabs are computed inside the component based on user type

const getTabs = () => {
  const isSfSeller = AuthService.isSfSeller();
  const isSkSeller = AuthService.isSkSeller();
  const isSkBuyer = AuthService.isSkBuyer();
  const isBuyer = AuthService.isBuyerUser();
  const canHandleB2b = AuthService.canHandleB2b();
  const isManpower = AuthService.isManpowerLoggedIn();

  const tabs: TabItem[] = [
    {
      name: "Joining Request",
      langKey: "joiningRequest",
      key: "joining-request",
      icon: <UserPlus />,
    },
    {
      name: "B2C Customers",
      langKey: "b2cCustomers",
      key: "b2c-customers",
      icon: <Users />,
    },
    {
      name: "B2B Retailers",
      langKey: "b2bRetailers",
      key: "b2b-retailers",
      icon: <Building2 />,
    },
    {
      name: "StoreKing Sellers",
      langKey: "storeKingSellers",
      key: "sk-sellers",
      icon: <Store />,
    },
  ];

  if (isManpower) {
    const ignoreTabs = ["joining-request", "sk-sellers"];
    return tabs.filter((tab) => !ignoreTabs.includes(tab.key));
  }

  if (isSkSeller) {
    const ignoreTabs = ["sk-sellers"];
    if (!canHandleB2b) {
      ignoreTabs.push("b2b-retailers");
    }
    return tabs.filter((tab) => !ignoreTabs.includes(tab.key));
  }

  if (isSkBuyer) {
    const ignoreTabs = ["sk-sellers", "joining-request"];
    if (!canHandleB2b) {
      ignoreTabs.push("b2b-retailers");
    }
    return tabs.filter((tab) => !ignoreTabs.includes(tab.key));
  }

  if (isSfSeller) {
    const ignoreTabs = ["joining-request"];
    return tabs.filter((tab) => !ignoreTabs.includes(tab.key));
  }

  if (isBuyer) {
    const ignoreTabs = ["joining-request"];
    if (!canHandleB2b) {
      ignoreTabs.push("b2b-retailers");
    }
    return tabs.filter((tab) => !ignoreTabs.includes(tab.key));
  }

  return [];
};

const NetworkManagementLayout = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [tabs, setTabs] = useState<TabItem[]>(getTabs());
  const fetchedJoiningCount = useRef(false);

  // Check if current URL contains specific routes
  const isSkSellersRoute = location.pathname.includes(
    "dashboard/network/management/sk-sellers"
  );
  const isJoiningRequestRoute = location.pathname.includes(
    "dashboard/network/management/joining-request"
  );
  const isB2cCustomersRoute = location.pathname.includes(
    "dashboard/network/management/b2c-customers"
  );
  const isB2bRetailersRoute = location.pathname.includes(
    "dashboard/network/management/b2b-retailers"
  );

  // Set title and breadcrumb based on route
  const pageTitle = isSkSellersRoute
    ? t("storeKingSellers")
    : isJoiningRequestRoute
      ? t("joiningRequest")
      : t("networkManagement");

  const dynamicBreadcrumbs: BreadcrumbItem[] = [
    {
      label: t("dashboard"),
      redirect: {
        path: "/dashboard",
      },
      langKey: "dashboard",
    },
    {
      label: pageTitle,
      langKey: isSkSellersRoute
        ? "storeKingSellers"
        : isJoiningRequestRoute
          ? "joiningRequest"
          : "networkManagement",
    },
  ];

  const rawActiveTab = searchParams.get("tab") || "overview";
  const activeTab = tabs.find((tab) => tab.key === rawActiveTab)?.key || "";

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "overview") {
      appNav.to(`/dashboard/network/management/overview`, {
        tab: tab.key,
      });
    } else if (tab.key === "b2c-customers") {
      appNav.to(`/dashboard/network/management/b2c-customers`, {
        tab: tab.key,
      });
    } else if (tab.key === "b2b-retailers") {
      appNav.to(`/dashboard/network/management/b2b-retailers`, {
        tab: tab.key,
      });
    } else if (tab.key === "sk-sellers") {
      appNav.to(`/dashboard/network/management/sk-sellers`, {
        tab: tab.key,
      });
    } else if (tab.key === "joining-request") {
      appNav.to(`/dashboard/network/management/joining-request`, {
        tab: tab.key,
      });
    } else if (tab.key === "analytics") {
      appNav.to(`/dashboard/network/management/analytics`, {
        tab: tab.key,
      });
    } else {
      appNav.to(`/dashboard/network/management/overview?tab=${tab.key}`);
    }
  };

  // Handle create button click
  const handleCreateClick = () => {
    if (isB2cCustomersRoute) {
      appNav.to("/dashboard/network/management/b2c-customers/manage");
    } else if (isB2bRetailersRoute) {
      appNav.to("/dashboard/network/management/b2b-retailers/manage");
    }
  };

  // Determine if create button should be shown
  const isManpower = AuthService.isManpowerLoggedIn();
  const isSalesEmployee = AuthService.isSalesEmployeeLoggedIn();
  const shouldShowCreateButton =
    isB2cCustomersRoute ||
    (isB2bRetailersRoute && (!isManpower || isSalesEmployee));

  // Fetch joining-request count once and set it on the tab
  useEffect(() => {
    const joiningTab = tabs.find((tab) => tab.key === "joining-request");
    if (joiningTab && !fetchedJoiningCount.current) {
      const fetchCount = async () => {
        try {
          const countResp =
            await FranchiseService.getJoiningRequesFromBuyerCount({
              filter: {
                status: "Pending",
              },
            });
          setTabs((prevTabs) => {
            const newTabs = [...prevTabs];
            const jt = newTabs.find((t) => t.key === "joining-request");
            if (jt) jt.count = countResp?.data?.count || 0;
            return newTabs;
          });
        } catch (e) {
          // ignore errors - don't block UI
        } finally {
          fetchedJoiningCount.current = true;
        }
      };
      fetchCount();
    }
  }, [tabs]);

  return (
    <>
      <AppHeader title={pageTitle} />
      <div
        className={`app-page page-bg page-padding ${shouldShowCreateButton ? "has-footer" : ""}`}
      >
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
              <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:mb-4 tw:gap-4">
                <div className="tw:flex-1">
                  <AppBreadcrumbs data={dynamicBreadcrumbs} />
                  <PageDescription description="manageNetwork" />
                </div>
                {shouldShowCreateButton && (
                  <div className="tw:hidden tw:md:block">
                    <AppButton
                      onClick={handleCreateClick}
                      size="small"
                      color="primary"
                      fill="solid"
                    >
                      <Plus className="tw:w-4 tw:h-4" />
                      {isB2cCustomersRoute
                        ? t("createCustomer")
                        : t("createB2bRetailer")}
                    </AppButton>
                  </div>
                )}
              </div>
              {/* <Summary /> */}
              <AppTab
                activeTab={activeTab}
                tabs={tabs}
                onTabChange={handleTabChange}
                className="tw:mb-4"
              />
              <Outlet />
            </div>
          </div>
        </div>
      </div>
      {shouldShowCreateButton && (
        <div className="app-footer tw:md:hidden">
          <div className="app-container">
            <AppButton
              className="tw:w-full"
              onClick={handleCreateClick}
              color="primary"
              fill="solid"
            >
              <Plus className="tw:w-4 tw:h-4 tw:mr-2" />
              {isB2cCustomersRoute ? t("createCustomer") : t("createRetailer")}
            </AppButton>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkManagementLayout;
