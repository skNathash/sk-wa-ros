import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import PageLoader from "~/components/core/page-loader/PageLoader";
import AppTab from "~/components/core/tab/AppTab";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import Summary from "./components/Summary";
import ActivityLog from "./components/activity-log/ActivityLog";
import Health, { type HealthCallback } from "./components/health/Health";
import Products from "./components/products/Products";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import PageAccessService from "~/services/PageAccessService";
import CommonService from "~/services/CommonService";
import BinOverview from "~/shared/inventory/components/bin-overview/BinOverview";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import BinListPane from "./components/bin-list-pane/BinListPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
// import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["INVENTORY.VIEW-LOCATIONS"]);
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "All Items",
    langKey: "allItems",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  {
    label: "Godown",
    langKey: "godown",
    redirect: { path: "/dashboard/inventory/rack-bin" },
  },
  { label: "Bin View" },
];

const tabItems: TabItem[] = [
  { key: "products", name: "Products", langKey: "products" },
  { key: "health", name: "Health", langKey: "binHealth" },
  { key: "activity-log", name: "Activity Log", langKey: "activityLog" },
];

const BinView = () => {
  const { t } = useTranslation(["common", "menu"]);
  const isTheme2 = useTheme() === "theme-2";
  const { isMobile } = useScreenView();
  const { binId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busyLoading, setBusyLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [bin, setBin] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("products");

  // Get dealId from query params
  const dealId = searchParams.get("dealId");

  const fetchData = async (isReFetch = false) => {
    if (isReFetch) {
      setBusyLoading(true);
    } else {
      setLoading(true);
    }

    const response = await RackBinService.getBin(
      AuthService.getLoggedInUserId() || "",
      binId || "",
    );
    if (response.statusCode === 200) {
      const d = response.data?.data;
      if (d.items.length) {
        d.items = d.items.sort((a: any, b: any) => {
          return a.dealName.localeCompare(b.dealName);
        });
      }

      // Add readable bin name to the bin data
      const locationType = d.locationId === "L1" ? "Sellable" : "Non-Sellable";
      const rackName = d.rackName || "";
      const binCode = d.binCode || "";
      d._binName = `${locationType} - ${rackName} - ${binCode}`;

      setBin({ ...d });
    } else {
      setBin(null);
    }

    if (isReFetch) {
      setBusyLoading(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (binId) {
      fetchData();
    }
  }, [binId]);

  // Effect to scroll to specific deal(s) when dealId is provided. A single id
  // comes from a deep link; the Health tab may pass several comma-separated
  // (one check can flag many deals) — all get highlighted, the first is
  // scrolled to.
  useEffect(() => {
    if (dealId && bin?.items) {
      // Set active tab to products if not already
      setActiveTab("products");

      // Small delay to ensure the products are rendered
      setTimeout(() => {
        const dealElements = dealId
          .split(",")
          .map((id) => document.querySelector(`[data-deal-id="${id.trim()}"]`))
          .filter((el): el is Element => Boolean(el));

        if (!dealElements.length) return;

        dealElements[0].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // Add highlight effect
        dealElements.forEach((el) =>
          el.classList.add(
            "tw:ring-2",
            "tw:ring-blue-500",
            "tw:ring-opacity-50",
          ),
        );
        setTimeout(() => {
          dealElements.forEach((el) =>
            el.classList.remove(
              "tw:ring-2",
              "tw:ring-blue-500",
              "tw:ring-opacity-50",
            ),
          );
        }, 3000);
      }, 500);
    }
  }, [dealId, bin?.items]);

  // A "Fix" / action tap on the Health tab jumps to the offending deals in the
  // Products tab — writing them to the query string reuses the scroll +
  // highlight effect above. Health reports ids straight off the health payload,
  // so each is resolved against the bin's own rows (by id or by the human deal
  // code) to be sure it matches a `data-deal-id` that actually exists.
  const handleHealthCallback = (a: HealthCallback) => {
    const items: any[] = bin?.items || [];
    const targetIds = a.data.deals
      .map(
        (deal) =>
          items.find(
            (item) =>
              item.dealId === deal.dealId ||
              (deal.dealRefId && item.dealRefId === deal.dealRefId),
          )?.dealId || deal.dealId,
      )
      .filter(Boolean);

    if (!targetIds.length) return;
    setActiveTab("products");
    setSearchParams({ dealId: targetIds.join(",") }, { replace: true });
  };

  // Products carries the row count, so the tab bar says how much is in the bin
  // before the tab is opened. Health / activity counts live inside those tabs.
  const tabs = useMemo<TabItem[]>(
    () =>
      tabItems.map((tab) =>
        tab.key === "products" && bin?.items?.length
          ? { ...tab, count: bin.items.length }
          : tab,
      ),
    [bin?.items?.length],
  );

  const handleCallback = (a: { action: string }) => {
    // Debug: trace callbacks from child components
    // eslint-disable-next-line no-console
    console.debug("BinView.handleCallback -> received:", a);
    // Refresh bin data after any data modification actions
    if (
      a.action === "stock-moved" ||
      a.action === "adjust-stock" ||
      a.action === "move-to-non-sellable" ||
      a.action === "barcode-added" ||
      a.action === "batch-updated" ||
      a.action === "batch-created"
    ) {
      fetchData(true);
      setRefresh((prev) => prev + 1);
    }
  };

  return (
    <>
      <AppHeader
        title={`Bin - ${
          bin?.locationId === "L1" ? "Sellable" : "Non-Sellable"
        } - ${bin?.rackName || ""} - ${bin?.binCode || ""}`}
        sectionKey="catalog"
        activeTab="godown"
        mobileLead="menu"
      />
      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — hidden here so the bin's own tab strip is the one bar
            pinned under the app header. */}
        {/* <SectionTabs sectionKey="catalog" activeTab="godown" noShadow sticky /> */}

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="godown"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            {/* theme-2 leads with a full-width bin overview header that runs
                edge to edge; the other themes keep the four summary stat cards
                inside the constrained container. With the section tab bar
                commented out above, this is the first block under the app
                header — `bin-overview-flush` cancels the page's 1rem top gutter
                so it sits flush against it. */}
            {!loading && bin && isTheme2 ? (
              <div className="bin-overview-flush">
                <BinOverview
                  binId={binId || ""}
                  bin={bin}
                  refresh={refresh}
                />
              </div>
            ) : null}

            <div className="app-container">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column spans the full grid — in theme-2 the CSS lifts
                    the side pane out of it into the fixed bin-list rail. */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <AppBreadcrumbs data={breadcrumbs} />
                  {loading ? <PageLoader /> : null}

                  {!loading && bin ? (
                    <>
                      {/* Legacy summary stat cards for non-theme-2 themes. */}
                      {!isTheme2 && (
                        <Summary
                          binId={binId || ""}
                          isSellable={bin?.isSellable}
                          refresh={refresh}
                        />
                      )}
                      {/* theme-2 carries these as free-standing pills on a
                          sticky white band that runs edge to edge — the same
                          treatment as the godown scope switch
                          (see RackBinTab). No `*-flush` here: the bin overview
                          header sits above the strip, so there's no page
                          gutter to cancel. */}
                      <AppTab
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={(tab) => setActiveTab(tab.key)}
                        variant={isTheme2 ? "pills" : "tabs"}
                        className={isTheme2 ? "app-nav-chips tw:mb-2" : ""}
                        // Mobile only: the band drops its side padding so the
                        // pills scroll edge to edge, and the swiper supplies
                        // the leading/trailing inset instead.
                        slideOffset={isTheme2 && isMobile ? 16 : 0}
                      />
                      <div>
                        {activeTab === "products" && (
                          <Products
                            data={bin.items}
                            binId={binId || ""}
                            binName={bin._binName}
                            callback={handleCallback}
                            dealId={dealId || undefined}
                            refresh={refresh}
                          />
                        )}
                        {activeTab === "health" && (
                          <Health
                            binId={binId || ""}
                            refresh={refresh}
                            callback={handleHealthCallback}
                          />
                        )}
                        {activeTab === "activity-log" && (
                          <ActivityLog binId={binId || ""} />
                        )}
                      </div>
                    </>
                  ) : (
                    <NoData />
                  )}
                </AppPaneMain>

                {/* Side column — theme-2 desktop only, where the CSS re-homes
                    it as the fixed bin list pane beside the icon rail. Lets the
                    user hop between bins without going back to the grid. */}
                <AppPaneSide className="app-pane-only">
                  <BinListPane
                    locationId={bin?.locationId || ""}
                    binId={binId || ""}
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BusyLoader show={busyLoading} message="Refreshing data..." />
    </>
  );
};

export default BinView;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Products Bin View"),
    },
  ];
}
