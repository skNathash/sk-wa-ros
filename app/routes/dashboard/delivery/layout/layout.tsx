import { useCallback, useState } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router";
import { Search, X } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import useScreenView from "~/hooks/useScreenView";
import PageDescription from "~/components/core/page-description/PageDescription";
import DeliverySectionTabs from "~/shared/delivery/components/delivery-section-tabs/DeliverySectionTabs";
import DeliverySidePane from "~/shared/delivery/components/delivery-side-pane/DeliverySidePane";
import DeliveryTabs, {
  DELIVERY_TABS,
} from "~/shared/delivery/components/delivery-tabs/DeliveryTabs";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { BreadcrumbItem } from "~/types/CommonTypes";

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

/**
 * Pages that open with their own white top strip (PageTopBar) and render the
 * delivery tabs inside it — the layout stays out of their way so the strip can
 * pin flush under the app header.
 */
const PAGES_WITH_OWN_TOP_BAR = [
  "/dashboard/delivery/dispatch",
  "/dashboard/delivery/in-transit",
  "/dashboard/delivery/cod-reconciliation",
];

const getNavKey = (path: string) => {
  if (path.includes("dispatch")) return "packages";
  if (path.includes("in-transit")) return "handoffs";
  if (path.includes("cod-reconciliation")) return "tracker";
  if (path.includes("marketplace-runners")) return "runners";
  if (path.includes("reconcile")) return "reconcile";
  return undefined;
};

const DeliveryLayout = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { isMobile } = useScreenView();
  const [showSearch, setShowSearch] = useState(false);
  // The route itself is the source of truth (a direct URL carries no `tab`
  // param); the param only stands in for routes outside the tab set.
  const activeTab =
    DELIVERY_TABS.find((tab) =>
      location.pathname.startsWith(`/dashboard/delivery/${tab.key}`),
    )?.key ||
    searchParams.get("tab") ||
    "dispatch";

  const ownsTopBar = PAGES_WITH_OWN_TOP_BAR.some((path) =>
    location.pathname.startsWith(path),
  );

  const activeNavKey = getNavKey(location.pathname);
  const isDispatch = location.pathname.startsWith("/dashboard/delivery/dispatch");
  const handleToggleSearch = useCallback(() => {
    setShowSearch((prev) => !prev);
  }, []);

  return (
    <>
      <AppHeader
        title="Delivery Management"
        sectionKey="bill"
        activeTab="logistics"
        mobileLead="menu"
        renderActions={
          isDispatch && isMobile ? (
            <AppButton
              onClick={handleToggleSearch}
              size="default"
              fill="clear"
              color="dark"
              noShadow
            >
              {showSearch ? (
                <X className="tw:h-5 tw:w-5" />
              ) : (
                <Search className="tw:h-5 tw:w-5" />
              )}
            </AppButton>
          ) : undefined
        }
      />
      <div className="app-page page-bg page-padding">
        <DeliverySectionTabs activeTab="dispatch" />
        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — bill section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="bill"
                activeTab="logistics"
                title="Bill"
              />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane). */}
              <AppPaneMain className="tw:lg:col-span-12">
                {/* Pages owning their top bar carry the breadcrumbs/description
                    themselves, below the strip — anything rendered above the
                    strip shows as a page-bg band under the header. */}
                {!ownsTopBar && (
                  <>
                    <AppBreadcrumbs data={breadcrumbs} />
                    <PageDescription
                      description="lastMileDelivery"
                      className="tw:mb-4"
                    />

                    <DeliveryTabs activeTab={activeTab} className="tw:mb-4" />
                  </>
                )}

                <Outlet context={{ showSearch }} />
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed pane
                  beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <DeliverySidePane
                  activeKey={activeTab}
                  activeNavKey={activeNavKey}
                />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeliveryLayout;
