import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";
import Overview from "./components/Overview";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import { useIsMobile } from "~/hooks/use-mobile";
import PageLoader from "~/components/core/page-loader/PageLoader";
import useTheme from "~/hooks/useTheme";
import PaylaterTierLadder from "~/shared/accounts/components/paylater/paylater-tier-ladder/PaylaterTierLadder";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import CustomerOverview from "./components/customer-overview/CustomerOverview";
import CustomerSidePane from "./components/side-pane/CustomerSidePane";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { SectionTab, TabItem } from "~/types/CommonTypes";
import { getDetails } from "./helper";
import CustomerHero from "./components/hero/CustomerHero";

import type { Customer } from "./components/Overview";
import PageAccessService from "~/services/PageAccessService";
import type { Route } from "./+types/layout";
import { useRevalidator } from "react-router";
import {
  Activity,
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

/**
 * The customer page's own tabs, in the shape {@link SectionTabs} takes. The
 * timeline is the bare customer URL, so it carries no path of its own; every
 * other tab is a child route under it.
 */
const tabItems: (Omit<SectionTab, "redirect"> & { path?: string })[] = [
  {
    key: "timeline",
    label: "Timeline",
    icon: <Activity />,
    langKey: "timeline",
  },
  {
    key: "overview",
    label: "Overview",
    icon: <LayoutDashboard />,
    langKey: "overview",
    path: "overview",
  },
  {
    key: "purchase-history",
    label: "Purchase History",
    icon: <History />,
    langKey: "purchaseHistory",
    path: "purchase-history",
  },
  {
    key: "loyalty-program",
    label: "Loyalty Program",
    icon: <Star />,
    langKey: "kingCoins",
    path: "loyalty-program",
  },
  // { key: "payments", label: "Payments", icon: <IndianRupee />, path: "payments" },
  {
    key: "statement",
    label: "Statement",
    icon: <FileText />,
    langKey: "statement",
    path: "statement",
  },
  {
    key: "paylater",
    label: "Paylater",
    icon: <CreditCard />,
    langKey: "paylater",
    path: "paylater",
  },
  { key: "kyc", label: "KYC", icon: <IdCard />, langKey: "kyc", path: "kyc" },
  {
    key: "notification-logs",
    label: "Notification Logs",
    icon: <MessagesSquare />,
    langKey: "notificationLogs",
    path: "notification-logs",
  },
];

const B2CNetworkLayout = ({ loaderData }: Route.ComponentProps) => {
  const customer = loaderData as Customer | undefined;
  const appNav = useAppNav();
  const location = useLocation();
  const revalidator = useRevalidator();
  const { t } = useTranslation(["common", "menu"]);
  const isTheme2 = useTheme() === "theme-2";
  const isMobile = useIsMobile();
  // The hero + section-tab treatment is the theme-2 phone layout; desktop keeps
  // the cards, the tab strip and the side pane it already had.
  const isTheme2Mobile = isTheme2 && isMobile;

  // The bare customer URL renders the timeline, so it is also the fallback.
  let activeTab =
    tabItems.find((item) => item.key === location.pathname.split("/").pop())
      ?.key || "timeline";

  const basePath = `/dashboard/network/view/b2c/${customer?._id}`;

  // Page tabs, fed to the shared SectionTabs bar — each one carries its own
  // destination, so the bar navigates without a handler here.
  const pageTabs: SectionTab[] = tabItems.map(({ path, ...tab }) => ({
    ...tab,
    redirect: { url: path ? `${basePath}/${path}` : basePath },
  }));

  // Desktop keeps its own strip, so it needs the plain tab shape and a handler.
  const appTabs: TabItem[] = tabItems.map((tab) => ({
    key: tab.key,
    name: tab.label,
    icon: tab.icon,
    langKey: tab.langKey,
  }));

  // Tabs swap the history entry rather than pushing one: they are sibling
  // views of the same customer, so back should leave the customer page, not
  // walk every tab that was opened along the way.
  const onTabChange = (tab: { key: string }) => {
    const target = tabItems.find((item) => item.key === tab.key);
    if (!target) return;
    appNav.replace(target.path ? `${basePath}/${target.path}` : basePath);
  };

  return (
    <>
      {/* Theme-2 drops the identity card, so the header carries the name —
          on mobile it is the only place it reads. */}
      <AppHeader
        title={
          isTheme2 && customer?.name ? customer.name : "B2C Network Details"
        }
        subtitle={isTheme2 && customer?.mobile ? customer.mobile : undefined}
        // A customer detail page is not a section root — the switcher sheet
        // belongs to the management list it was opened from, so the header
        // keeps the plain name/mobile title and leads with the back arrow.
      />
      <div className="page-bg app-page page-padding">
        <div className="app-container">
          {/* Page tabs ride the shared section-tab bar, fed the customer's own
              tab list — on phones they sit at the top of the screen, straight
              under the header. The business switcher is parked here: it would
              only crowd them. */}
          {isTheme2Mobile ? (
            <SectionTabs
              tabs={pageTabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
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
                    customer pane (see AppPane). */}
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* Phone layout opens on the full-bleed hero, so it skips the
                      spacer and sits straight under the app header. */}
                  {!isTheme2Mobile ? (
                    <div className="theme-2-mobile-only tw:h-4" />
                  ) : null}
                  <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

                  {!customer ? (
                    <PageLoader />
                  ) : !customer._id ? (
                    <NoData />
                  ) : (
                    <>
                      {isTheme2Mobile ? (
                        /* Phone layout: the hero carries who the customer is,
                           their headline numbers and the actions taken on them —
                           the page tabs run above it, at the top of the screen;
                           the numbers follow as a swipeable tile rail, then the
                           paylater ladder as its own card. */
                        <>
                          {/* `app-bleed-x` pulls the band out of the page
                              gutter so the hero runs edge to edge, and
                              `detail-hero-plate` drops the card radius now that
                              the sides touch. */}
                          <div className="app-bleed-x tw:mb-4">
                            <CustomerHero
                              customer={customer}
                              className="detail-hero-plate tw:ring-0"
                            />
                          </div>
                          {/* Numbers ride a tile rail under the hero — the
                              same stats the desktop card shows, sized for a
                              thumb. */}
                          <CustomerOverview
                            customer={customer}
                            className="tw:mb-4"
                          />
                          <div className="tw:mb-4">
                            <PaylaterTierLadder
                              userId={customer._id}
                              onRefresh={() => revalidator.revalidate()}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Theme-2 replaces the identity card with the numbers
                              card + the paylater ladder — who the customer is
                              already reads from the side pane and the header. */}
                          {isTheme2 ? (
                            /* Numbers + paylater read as one band — side by side
                               once the column is wide enough to hold both. */
                            <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-2">
                              <CustomerOverview
                                customer={customer}
                                className="tw:mb-0 tw:h-full"
                              />
                              <PaylaterTierLadder
                                userId={customer._id}
                                onRefresh={() => revalidator.revalidate()}
                              />
                            </div>
                          ) : (
                            <Overview
                              customer={customer}
                              onRefresh={() => revalidator.revalidate()}
                            />
                          )}

                          {/* Pills read lighter against the theme-2 page
                              background; the legacy theme keeps the segmented
                              bar. In theme-2 the strip sits in its own white
                              container so it reads as a band between the cards
                              above and the panel below. */}
                          <div className="tw:mb-4">
                            <AppTab
                              tabs={appTabs}
                              activeTab={activeTab}
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
                {customer?._id ? (
                  <AppPaneSide className="app-pane-only">
                    <CustomerSidePane customer={customer} />
                  </AppPaneSide>
                ) : null}
              </div>
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
