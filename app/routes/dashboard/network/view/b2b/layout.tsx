import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import { useIsMobile } from "~/hooks/use-mobile";
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
import useTheme from "~/hooks/useTheme";
import PageAccessService from "~/services/PageAccessService";
import PaylaterTierLadder from "~/shared/accounts/components/paylater/paylater-tier-ladder/PaylaterTierLadder";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import type { SectionTab, TabItem } from "~/types/CommonTypes";
import BasicInfo from "./components/BasicInfo";
import RetailerHero from "./components/hero/RetailerHero";
import RetailerOverview from "./components/retailer-overview/RetailerOverview";
import RetailerSidePane from "./components/side-pane/RetailerSidePane";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-USERS"]);
}

/**
 * The retailer page's own tabs, in the shape {@link SectionTabs} takes. Orders
 * is the bare retailer URL, so it carries no path of its own; every other tab
 * is a child route under it.
 */
const tabs: (Omit<SectionTab, "redirect"> & { path?: string })[] = [
  { label: "Orders", key: "orders", icon: <ListOrdered />, langKey: "orders" },
  // {
  //   label: "Payments",
  //   key: "payments",
  //   icon: <IndianRupee />,
  //   langKey: "payments",
  //   path: "payments",
  // },
  {
    label: "Statement",
    key: "statement",
    icon: <FileText />,
    langKey: "statement",
    path: "statement",
  },
  {
    label: "Paylater",
    key: "paylater",
    icon: <CreditCard />,
    langKey: "paylater",
    path: "paylater",
  },
  // { label: "Settings", key: "settings", icon: <Settings />, path: "settings" },
  { label: "KYC", key: "kyc", icon: <IdCard />, langKey: "kyc", path: "kyc" },
  {
    key: "notification-logs",
    label: "Notification Logs",
    icon: <MessagesSquare />,
    langKey: "notificationLogs",
    path: "notification-logs",
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
  const location = useLocation();
  const { t } = useTranslation(["common", "menu"]);
  const isTheme2 = useTheme() === "theme-2";
  const isMobile = useIsMobile();
  // The hero + section-tab treatment is the theme-2 phone layout; desktop keeps
  // the cards, the tab strip and the side pane it already had.
  const isTheme2Mobile = isTheme2 && isMobile;

  const { id } = useParams<{ id: string }>();

  const [franchise, setFranchise] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const activeTab = getActiveTab(location);

  const loadFranchise = useCallback(async (fid: string) => {
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
  }, []);

  useEffect(() => {
    if (id) loadFranchise(id);
  }, [id, loadFranchise]);

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

  // Page tabs, fed to the shared SectionTabs bar — each one carries its own
  // destination, so the bar navigates without a handler here.
  const basePath = `/dashboard/network/view/b2b/${id}`;
  const pageTabs: SectionTab[] = tabs.map(({ path, ...tab }) => ({
    ...tab,
    redirect: { url: path ? `${basePath}/${path}` : basePath },
  }));

  // Desktop keeps its own strip, so it needs the plain tab shape and a handler.
  const appTabs: TabItem[] = tabs.map((tab) => ({
    key: tab.key,
    name: tab.label,
    icon: tab.icon,
    langKey: tab.langKey,
  }));

  const onTabChange = (tab: TabItem) => {
    const target = tabs.find((item) => item.key === tab.key);
    if (!target) return;
    appNav.to(target.path ? `${basePath}/${target.path}` : basePath);
  };

  return (
    <>
      {/* Theme-2 drops the identity card, so the header carries the store name —
          on mobile it is the only place it reads. */}
      <AppHeader
        title={
          isTheme2 && franchise?.name ? franchise.name : "Retailer Details"
        }
        subtitle={isTheme2 && franchise?.mobile ? franchise.mobile : undefined}
        // theme-2 mobile: the hero below carries the retailer's identity, so
        // the header turns into the section switcher (dropdown) with the
        // account-menu hamburger leading it. Desktop is unaffected.
        sectionKey="business"
        activeTab="customers"
        mobileLead="menu"
      />

      <div className="app-page page-bg page-padding">
        <div className="app-container">
          {/* Section tabs — parked: on phones the page's own tabs take this
              slot instead, so the business switcher would only crowd them. */}
          {/* <SectionTabs
            sectionKey="business"
            activeTab="customers"
            noShadow
            sticky
          /> */}

          {/* Page tabs ride the shared section-tab bar, fed the retailer's own
              tab list — on phones they sit at the top of the screen, straight
              under the header, bled out of the page gutter with the first chip
              kept on it. */}
          {isTheme2Mobile ? (
            <SectionTabs
              sectionKey="business"
              tabs={pageTabs}
              activeTab={activeTab || "orders"}
              noShadow
              sticky
            />
          ) : null}

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
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column — spans the full grid; in theme-2 desktop the
                    CSS lifts the side pane out of the grid into the fixed
                    retailer pane (see AppPane). */}
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* Phone layout opens on the full-bleed hero, so it skips the
                      spacer and sits straight under the app header. */}
                  {!isTheme2Mobile ? (
                    <div className="theme-2-mobile-only tw:h-4" />
                  ) : null}
                  <AppBreadcrumbs data={breadcrumbData} className="tw:mb-4" />

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
                    <>
                      {isTheme2Mobile ? (
                        /* Phone layout: the hero carries who the shop is, its
                           headline numbers and the actions taken on it — the
                           page tabs run above it, at the top of the screen; the
                           numbers card and the ladder would only repeat the hero
                           here. */
                        <>
                          {/* `app-bleed-x` pulls the band out of the page
                              gutter so the hero runs edge to edge, and
                              `detail-hero-plate` drops the card radius now that
                              the sides touch. */}
                          <div className="app-bleed-x tw:mb-4">
                            <RetailerHero
                              franchise={franchise}
                              className="detail-hero-plate tw:ring-0"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Theme-2 replaces the identity card with the numbers
                              card + the paylater ladder — who the retailer is
                              already reads from the side pane and the header. */}
                          {isTheme2 ? (
                            /* Numbers + paylater read as one band — side by side
                               once the column is wide enough to hold both. */
                            <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-2">
                              <RetailerOverview
                                franchise={franchise}
                                className="tw:mb-0 tw:h-full"
                              />
                              <PaylaterTierLadder
                                userId={franchise._id}
                                type="b2b"
                                onRefresh={() => id && loadFranchise(id)}
                              />
                            </div>
                          ) : (
                            <div className="tw:mb-4">
                              <BasicInfo franchise={franchise} />
                            </div>
                          )}

                          {/* Pills read lighter against the theme-2 page
                              background; the legacy theme keeps the segmented
                              bar. In theme-2 the strip sits in its own white
                              container so it reads as a band between the cards
                              above and the panel below. */}
                          <div className="tw:mb-4">
                            <AppTab
                              tabs={appTabs}
                              activeTab={activeTab || "orders"}
                              onTabChange={onTabChange}
                              variant={isTheme2 ? "underline" : "tabs"}
                            />
                          </div>
                        </>
                      )}
                      <Outlet />
                    </>
                  )}
                </AppPaneMain>

                {/* Side column — only rendered inside the theme-2 split
                    layout, where the CSS re-homes it as the fixed pane. */}
                {!loading && franchise?._id ? (
                  <AppPaneSide className="app-pane-only">
                    <RetailerSidePane franchise={franchise} />
                  </AppPaneSide>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
