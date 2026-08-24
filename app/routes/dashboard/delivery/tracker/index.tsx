import { useCallback } from "react";
import { useSearchParams } from "react-router";
import AppHeader from "~/components/core/header/AppHeader";
import SegmentedControl from "~/components/core/segmented-control/SegmentedControl";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { TabItem } from "~/types/CommonTypes";
import ByOrder from "./components/by-order/ByOrder";
import ByRunner from "./components/by-runner/ByRunner";
import RunnerDetail from "./components/runner-detail/RunnerDetail";
import RunnerList from "./components/runner-list/RunnerList";
import RunnerMapView from "./components/runner-map-view/RunnerMapView";
import TrackerSidePane from "./components/side-pane/TrackerSidePane";
import DeliverySectionTabs from "~/shared/delivery/components/delivery-section-tabs/DeliverySectionTabs";
import useScreenView from "~/hooks/useScreenView";

/** How the tracker page itself is viewed — the map, or a runner/order list. */
type TrackerViewKey = "map" | "runners" | "orders";

const TRACKER_VIEW_PARAM = "view";

const VIEWS: TabItem[] = [
  { name: "Live Map", key: "map" },
  { name: "By Runner", key: "runners" },
  { name: "By Order", key: "orders" },
];

export async function clientLoader() {
  return PageAccessService.canAccessPage(["DELIVERY.DISPATCH"]);
}

/**
 * Marketplace runners — the third-party runners working around the store,
 * ranked by the toolbar's sort, with the picked runner's profile living in the
 * theme-2 side pane.
 */
const Tracker = () => {
  const appToast = useAppToast();
  const { isMobile } = useScreenView();

  const [searchParams, setSearchParams] = useSearchParams();

  const applyFilter = useCallback(async () => {}, []);

  const activeView = (searchParams.get(TRACKER_VIEW_PARAM) ||
    "map") as TrackerViewKey;

  const handleViewChange = (tab: TabItem) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(TRACKER_VIEW_PARAM, tab.key);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  };

  return (
    <>
      <AppHeader
        title="Tracker"
        sectionKey="bill"
        activeTab="logistics"
        mobileLead="menu"
      />

      <div className="app-page page-bg page-padding">
        <DeliverySectionTabs activeTab="tracker" />

        {/* Tracker's own view switch — live map / by runner / by order.
            Mobile only (the desktop sidebar owns this navigation). Rendered
            outside the section layout (icon rail + page gutter) so the tab
            block itself runs edge to edge of the screen. Styled as theme-2's
            iOS-style segmented control: a white band with a faint brand-tinted
            track inside, the active view lifting onto a white pill that carries
            the green. */}
        <div className="app-full-bleed theme-2-mobile-only tw:bg-white tw:px-4 tw:py-2">
          <SegmentedControl
            items={VIEWS}
            value={activeView}
            onChange={(key) => handleViewChange({ name: key, key })}
          />
        </div>

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — bill section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="bill"
                activeTab="logistics"
                title="Delivery"
              />
            </div>
          </aside>

          <div className="section-content">
            {activeView === "runners" ? (
              <ByRunner />
            ) : activeView === "orders" ? (
              <ByOrder />
            ) : activeView === "map" ? (
              isMobile ? (
                // Mobile — the fixed-height map fills the top of the screen,
                // the runner queue lists every live shipment beneath it, and
                // the detail/side panes are desktop-only.
                <div className="tw:flex tw:flex-col tw:gap-4">
                  <div className="app-bleed-x">
                    <RunnerMapView />
                  </div>
                  <RunnerList />
                </div>
              ) : (
                <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                  {/* Main column — the live runner map. In theme-2 desktop the
                      side pane is lifted out of the grid into the fixed list
                      pane, so the main column spans the full width there. */}
                  <AppPaneMain>
                    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:w-full">
                      <RunnerMapView />
                      <RunnerDetail runnerId={searchParams.get("runner") || ""} />
                    </div>
                  </AppPaneMain>

                  {/* Runner detail block — lives in the side pane on desktop. */}
                  <AppPaneSide>
                    <TrackerSidePane />
                  </AppPaneSide>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default Tracker;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Tracker"),
    },
  ];
}
