import clsx from "clsx";
import AppHeader from "~/components/core/header/AppHeader";
// import Summary from "./components/Summary";
import { Outlet, useLocation, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import PaylaterService from "~/services/PaylaterService";
import AuthService from "~/services/AuthService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import PaylaterRequestCard from "~/shared/accounts/components/paylater/paylater-req-card/PaylaterRequestCard";
import PageDescription from "~/components/core/page-description/PageDescription";
import { useTranslation } from "react-i18next";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
// import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PaylaterPane from "~/shared/accounts/components/paylater/paylater-pane/PaylaterPane";

const tabs: TabItem[] = [
  {
    name: "Analytics",
    key: "analytics",
    langKey: "analytics",
    icon: "chart-no-axes-column",
  },
  {
    name: "Approvals",
    key: "approvals",
    langKey: "approvals",
    icon: "clock",
  },
  {
    name: "Nudges",
    key: "nudges",
    langKey: "nudges",
    icon: "megaphone",
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
    name: "Ready to Unlock",
    key: "ready-to-unlock",
    langKey: "readyToUnlock",
    icon: "sparkles",
  },
  {
    name: "Unlock",
    key: "unlock",
    langKey: "unlock",
    icon: "lock-open",
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
  const isTheme2 = useTheme() === "theme-2";
  const { isMobile } = useScreenView();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const activeTab = searchParams.get("tab") || "analytics";

  const [b2cCount, setB2cCount] = useState<number | null>(null);
  const [b2bCount, setB2bCount] = useState<number | null>(null);

  // Attach counts to tabs so AppTab can render them
  const tabsWithCounts: TabItem[] = tabs.map((t) => {
    if (t.key === "b2c-wallets") return { ...t, count: b2cCount ?? undefined };
    if (t.key === "b2b-wallets") return { ...t, count: b2bCount ?? undefined };
    // The approval queue holds both books, so its badge is the two pending
    // counts added up — no third call needed.
    if (t.key === "approvals") {
      const pending = (b2cCount ?? 0) + (b2bCount ?? 0);
      return {
        ...t,
        count: b2cCount === null && b2bCount === null ? undefined : pending,
      };
    }
    return t;
  });

  const isManpower = AuthService.isManpowerLoggedIn();
  const visibleTabs = tabsWithCounts.filter((t) => {
    if (isManpower && t.key === "my-paylater") return false;
    return true;
  });

  const normalizedActiveTab = activeTab;

  // Header title follows the route, not the `?tab=` param: every screen under
  // this layout showed the bare section name before, and a deep link that
  // carries no `tab` (the unlock page opened straight from a wallet row) would
  // otherwise be titled after whatever tab defaults in. Wallets live at
  // `/wallets/:type`, so their key is rebuilt from the last segment.
  const routeKey = pathname.startsWith("/dashboard/paylater/wallets/")
    ? `${pathname.split("/").filter(Boolean).pop()}-wallets`
    : pathname.replace(/^\/dashboard\/paylater\/?/, "") || "analytics";
  const routeTab = visibleTabs.find((tab) => tab.key === routeKey);
  const headerTitle = routeTab
    ? `${t("paylater")} · ${
        routeTab.langKey
          ? // Falls back to the tab's own name so a locale missing the key
            // shows "Unlock", not the raw `unlock` string.
            t(routeTab.langKey, { defaultValue: routeTab.name })
          : routeTab.name
      }`
    : t("paylater");

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
    } else if (tab.key === "approvals") {
      appNav.to(`/dashboard/paylater/approvals`, {
        tab: tab.key,
      });
    } else if (tab.key === "nudges") {
      appNav.to(`/dashboard/paylater/nudges`, {
        tab: tab.key,
      });
    } else if (tab.key === "orders") {
      appNav.to(`/dashboard/paylater/orders`, {
        tab: tab.key,
      });
    } else if (tab.key === "ready-to-unlock") {
      appNav.to(`/dashboard/paylater/ready-to-unlock`, {
        tab: tab.key,
      });
    } else if (tab.key === "unlock") {
      appNav.to(`/dashboard/paylater/unlock`, {
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
      {/* theme-2 mobile leads with the hamburger instead of a back arrow —
          PayLater is a top-level section landing, so there is no meaningful
          back target. `sectionKey` puts the Business menu list behind both the
          hamburger and the tappable title; desktop is unaffected (side rail). */}
      <AppHeader
        title={headerTitle}
        sectionKey="business"
        activeTab="paylater"
        mobileLead="menu"
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          {/* <SectionTabs
            sectionKey="business"
            activeTab="paylater"
            noShadow
            sticky
          /> */}

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
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column — spans the full grid (the side pane only
                    exists in theme-2 desktop, where the CSS lifts it out of
                    the grid into the fixed list pane; see AppPane). */}
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* theme-2 hides both the breadcrumbs and the page
                      description, so this row would collapse to an empty band
                      that still pays its bottom margin — drop it there. */}
                  <div className="tw:mb-4 theme-2-hide">
                    <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
                    <PageDescription description="paylaterManagement" />
                  </div>

                  <PaylaterRequestCard />
                  {/* Tabs hide in theme-2 desktop — the side pane's chips
                      replace them there (see app-pane-hide in theme-2.css).
                      theme-2 carries this sub-nav as free-standing pills on a
                      sticky white band; with the section tab strip commented
                      out above, the band is the first block under the app
                      header, so `app-nav-chips-flush` cancels the page gutter
                      and grid gap that would otherwise leave a cream strip
                      between the two. Other themes keep the segmented bar. */}
                  <AppTab
                    activeTab={normalizedActiveTab}
                    tabs={visibleTabs}
                    onTabChange={handleTabChange}
                    variant={isTheme2 ? "pills" : "tabs"}
                    className={clsx(
                      "tw:mb-4 app-pane-hide",
                      isTheme2
                        ? // On mobile the chip band sits on its own white strip
                          // right under the header, so 1rem leaves the first
                          // card looking glued to it — open it up a little.
                          "app-nav-chips app-nav-chips-flush tw:max-md:mb-6"
                        : "edge-tabs app-tabs-tray app-tabs-sticky",
                    )}
                    // Mobile only: the band drops its side padding so the pills
                    // scroll edge to edge; the swiper supplies the inset.
                    slideOffset={isTheme2 && isMobile ? 16 : 0}
                  />
                  <Outlet />
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout
                    is active (lg+), where the CSS re-homes it as the fixed
                    list pane beside the section icon rail. */}
                <AppPaneSide className="app-pane-only">
                  <PaylaterPane title={t("paylater")} />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountsLayout;
