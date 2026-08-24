import { produce } from "immer";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type {
  BreadcrumbItem,
  PaginationState,
  TabItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import Filter from "./components/Filter";
import Summary from "./components/Summary";
import DesktopView from "./components/item/DesktopView";
import MobileView from "./components/item/MobileView";
import { Plus, Users } from "lucide-react";

import {
  defaultSummary,
  getCount,
  getData,
  getSummary,
  prepareFilterParams,
} from "./helper";
import PoListTabs from "../components/tabs/PoListTabs";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import PageAccessService from "~/services/PageAccessService";
import Rbac from "~/components/core/rbac/Rbac";
import CommonService from "~/services/CommonService";
import SkSellerAvailableNote from "~/shared/vendor/components/sk-seller-available/SkSellerAvailableNote";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PageHeader from "~/shared/page-header/PageHeader";
import useTheme from "~/hooks/useTheme";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["PURCHASE-ORDER.PO-VIEW-ORDERS"]);
}

interface FilterState {
  search?: string;
  dateRange?: Date[] | null;
  status?: string;
  feature?: string;
  activeTab?: string; // Added for tab tracking
}

// Default filter state
const defaultFilter: FilterState = {
  search: "",
  dateRange: null,
  status: "",
  feature: "purchase",
};

const rbacRoles = {
  createPO: ["PURCHASE-ORDER.CREATE"],
  viewVendors: ["VENDOR.VIEW"],
};

const PurchaseOrderDashboard = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";

  const [view, setView] = useState<ViewToggleType>("list");

  const tabItems: TabItem[] = [
    { name: t("overview"), key: "overview" },
    { name: t("receiveOrders"), key: "receive-orders" },
    // { name: t("draftOrders"), key: "draft-orders" },
    // { name: t("rejectedOrders"), key: "rejected-orders" },
    { name: t("recentlyReceived"), key: "recently-received" },
    { name: t("autoAllocation"), key: "auto-allocation" },
  ];

  const [searchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || tabItems[0].key;

  const feature = searchParams.get("feature") || "purchase";

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const [summary, setSummary] = useState<any[]>([...defaultSummary]);

  const filterRef = useRef<FilterState>({
    ...defaultFilter,
    activeTab,
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: "asc" | "desc" | undefined }>({
    key: "createdAt",
    value: "desc",
  });

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    {
      label: t("dashboard"),
      redirect: {
        path: "/dashboard",
        params: {},
      },
    },
    {
      label: t("purchaseOrders"),
    },
  ];

  // Load purchase orders list
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const ordersData = await getData(params);

      setOrders(ordersData);
      setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);

      // Update pagination end number
      const currentStart = paginationRef.current.startSlNo;
      const currentEnd = Math.min(
        currentStart + ordersData.length - 1,
        paginationRef.current.totalRecords
      );
      paginationRef.current.endSlNo = currentEnd;
    } catch (error) {
      console.error("Error loading purchase orders:", error);
      setOrders([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more data for load more button
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }

    setLoadingMore(true);
    try {
      // Update pagination for next page
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };

      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const ordersData = await getData(params);

      setOrders((prev) => [...prev, ...ordersData]);
      setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);

      // Update pagination end number for load more button
      const newEnd = Math.min(
        paginationRef.current.endSlNo + ordersData.length,
        paginationRef.current.totalRecords
      );
      paginationRef.current.endSlNo = newEnd;
    } catch (error) {
      console.error("Error loading more purchase orders:", error);
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const loadSummary = useCallback(async () => {
    setSummary(
      produce((draft) => {
        draft.forEach((item) => {
          item.loading = true;
        });
      })
    );

    try {
      // Use getSummary from helper.ts
      const summaryResult = await getSummary(filterRef.current);
      setSummary(
        produce((draft) => {
          draft.forEach((item) => {
            item.loading = false;

            if (Array.isArray(summaryResult)) {
              // fallback: error case, set all to 0
              item.value = 0;
            } else {
              switch (item.key) {
                case "totalPoValue":
                  item.value = summaryResult.totalPoValue || 0;
                  break;
                case "pendingOrders":
                  item.value = summaryResult.pendingOrders || 0;
                  break;
                case "receivedToday":
                  item.value = summaryResult.receivedToday || 0;
                  break;
                case "totalPo":
                  item.value = summaryResult.totalPo || 0;
                  break;
                default:
                  item.value = 0;
              }
            }
          });
        })
      );
    } catch (error) {
      console.error("Error loading summary:", error);
      setSummary(
        produce((draft) => {
          draft.forEach((item) => {
            item.loading = false;
            item.value = 0;
          });
        })
      );
    }
  }, []);

  // Apply filter and reset pagination
  const applyFilter = useCallback(
    async (canLoadSummary: boolean = true) => {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: 1,
        startSlNo: 1,
        endSlNo: paginationRef.current.rowsPerPage,
      };

      if (canLoadSummary) {
        loadSummary();
      }

      setLoading(true);
      setLoadingTotalRecords(true);
      setOrders([]);

      try {
        // Get total count first
        const params = prepareFilterParams(
          filterRef.current,
          paginationRef.current,
          sortRef.current
        );
        const totalRecords = await getCount(params);

        paginationRef.current.totalRecords = totalRecords;
      } finally {
        setLoadingTotalRecords(false);
        setLoading(false);
      }

      await loadList();
    },
    [loadList, loadSummary]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (filterData: Partial<FilterState>) => {
      filterRef.current = {
        ...filterRef.current,
        ...filterData,
      };
      applyFilter();
    },
    [applyFilter]
  );

  // Sort handler
  const handleSortChange = useCallback(
    ({ key, value }: { key: string; value: "asc" | "desc" | undefined }) => {
      if (value) {
        sortRef.current = { key, value };
        applyFilter(false);
      }
    },
    [applyFilter]
  );

  // Handle order item click
  const onOrderItemClick = useCallback(
    ({ action, data }: { action: string; data: any }) => {
      if (action === "view") {
        appNav.to(`/dashboard/purchase-order/view/${data._id}`);
      } else if (action === "edit") {
        const vendorId = data.vendorDetails?.id || data.vendor?.id;
        const queryParams = new URLSearchParams({ id: data._id });
        if (vendorId) {
          queryParams.append("vid", vendorId);
        }
        appNav.to(`/dashboard/purchase-order/manage?${queryParams.toString()}`);
      } else if (action === "receive") {
        if (data._isFromSk) {
          appNav.to(`/dashboard/orders/primary/receive/sk/process/${data._id}`);
        } else {
          appNav.to(`/dashboard/purchase-order/process/${data._id}`);
        }
      } else if (action === "viewVendor") {
        const vendorId = data.vendorInfo?.id;
        if (vendorId) {
          appNav.to(`/dashboard/vendor/view/${vendorId}`);
        }
      }
    },
    [appNav]
  );

  // Load data on component mount
  useEffect(() => {
    filterRef.current = {
      ...defaultFilter,
      feature,
      activeTab,
    };

    applyFilter();
  }, [applyFilter, feature, activeTab]);

  // Handle create purchase order
  const handleCreatePurchaseOrder = useCallback(() => {
    appNav.to("/dashboard/purchase-order/vendors", {
      from: "po",
    });
  }, [appNav]);

  const onSummaryClick = useCallback(
    (value: string) => {
      filterRef.current = {
        ...filterRef.current,
        status: value,
      };
      applyFilter();
    },
    [applyFilter]
  );

  // Tab change handler
  const onTabChange = useCallback(
    (tab: TabItem) => {
      appNav.to("/dashboard/purchase-order/list", {
        tab: tab.key,
      });
      // setActiveTab(tab.key);
      // // Store activeTab in filterRef
      // filterRef.current = {
      //   ...filterRef.current,
      //   activeTab: tab.key,
      // };
      // applyFilter(false);
    },
    [appNav]
  );

  return (
    <>
      <AppHeader
        title={t("purchaseOrders")}
        showAudioNote={true}
        audioNoteTitle={t("purchaseOrders")}
        audioFeature="po"
      />
      <div className="tw:p-4 page-bg app-page">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
            `sticky` pins them under the header and breaks out of the page
            padding so the underline runs edge to edge. */}
        <SectionTabs
          sectionKey="supply"
          activeTab="purchase-orders"
          noShadow
          sticky
        />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="purchase-orders"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main feed column — spans the full grid in theme-2 desktop
                  because the side pane is lifted into the fixed rail panel. */}
              <AppPaneMain className="tw:lg:col-span-12 tw:space-y-0">
                <SkSellerAvailableNote />
                {/* Hidden in theme-2 at every breakpoint — the app header
                    already shows "Purchase Orders", so this would be a
                    second copy of the same title on the page. */}
                <div className="theme-2-hide tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2 tw:mb-4">
                  <PageHeader
                    breadcrumbs={defaultBreadcrumbs}
                    title={t("purchaseOrders")}
                    description="purchaseOrder"
                  />
                  {!isTheme2 && (
                    <div className="tw:flex tw:gap-2">
                      <Rbac roles={rbacRoles.viewVendors}>
                        <AppButton
                          size="small"
                          onClick={() => appNav.to("/dashboard/vendor/list")}
                          noShadow={true}
                          fill="outline"
                        >
                          <Users className="tw:mr-1" size={16} aria-hidden />
                          {t("vendors")}
                        </AppButton>
                      </Rbac>
                      <Rbac roles={rbacRoles.createPO}>
                        <AppButton
                          size="small"
                          onClick={handleCreatePurchaseOrder}
                          noShadow={true}
                        >
                          <Plus className="tw:mr-1" size={16} aria-hidden />
                          {t("createPO")}
                        </AppButton>
                      </Rbac>
                    </div>
                  )}
                </div>

                {!isTheme2 && (
                  <PoListTabs activeTab={activeTab} className="tw:mb-4" />
                )}

                {activeTab !== "auto-allocation" && (
                  <>
                    {feature === "purchase" && (
                      <Summary
                        summary={summary}
                        callback={onSummaryClick}
                        selected={filterRef.current.status}
                      />
                    )}
                    {/* Filter sits in its own card so the list/table below is a
                        separate, edge-to-edge surface. */}
                    <AppCard noPadding>
                      <div className="tw:p-2">
                        <Filter
                          onFilterChange={handleFilterChange}
                          feature={feature}
                          activeTab={activeTab}
                        />
                      </div>
                    </AppCard>

                    <div className="tw:flex tw:justify-between tw:items-center tw:mb-3">
                      <div>
                        <PaginationSummary
                          paginationConfig={paginationRef.current}
                          loadingTotalRecords={loadingTotalRecords}
                          fwSize="sm"
                          loadedCount={orders.length}
                        />
                      </div>
                      <ViewToggle viewType={view} callback={setView} />
                    </div>

                    {orders.length === 0 && !loading && (
                      <AppCard>
                        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-12 tw:text-gray-500">
                          <div>{t("noPurchaseOrdersFound")}</div>
                          <div className="tw:text-xs tw:mt-1">
                            {t("tryAdjustingFilters")}
                          </div>
                        </div>
                      </AppCard>
                    )}

                    {isMobile || view == "card" ? (
                      <>
                        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
                          {orders.map((order: any) => (
                            <div key={order._id}>
                              <MobileView
                                data={order}
                                callback={onOrderItemClick}
                                tab={activeTab}
                              />
                            </div>
                          ))}
                        </div>
                        {hasMoreData && !loading && (
                          <LoadMoreButton
                            loadMore={loadMore}
                            loading={loadingMore}
                            totalCount={paginationRef.current.totalRecords}
                            loadedCount={orders.length}
                          />
                        )}
                      </>
                    ) : (
                      // DesktopView renders nothing once loading settles with no
                      // rows, so skip the empty card shell in that state.
                      (loading || orders.length > 0) && (
                        <AppCard noPadding>
                          <DesktopView
                            data={orders}
                            callback={onOrderItemClick}
                            tab={activeTab}
                            sortKey={sortRef.current.key}
                            sortValue={sortRef.current.value || "desc"}
                            sortCb={handleSortChange}
                            loading={loading}
                            showLoadMore={hasMoreData}
                            loadingMore={loadingMore}
                            loadMore={loadMore}
                            totalCount={paginationRef.current.totalRecords}
                          />
                        </AppCard>
                      )
                    )}
                  </>
                )}
              </AppPaneMain>

              {/* Side pane — only active in theme-2 desktop, where it is
                  re-homed as the fixed quick-action panel beside the rail. */}
              <AppPaneSide className="app-pane-only">
                <PurchaseOrderSidePane />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PurchaseOrderDashboard;

export function meta() {
  return [{ title: CommonService.prepareAppDocumentTitle("Purchase Orders") }];
}
