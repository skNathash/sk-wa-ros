import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import type {
  BreadcrumbItem,
  PaginationState,
  ViewToggleType,
} from "~/types/CommonTypes";
import Filter from "./components/Filter";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import PoListTabs from "../components/tabs/PoListTabs";
import DesktopView from "./components/DesktopView";
import BusyLoader from "~/components/core/busyloader/Busyloader";

import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PoScanBanners from "~/shared/purchase-order/components/PoScanBanners";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";

import {
  getCount,
  getData,
  prepareFilterParams,
  prepareFilterQueryParams,
} from "./helper";

import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import ViewBoxItemsModal from "~/shared/orders/receive-box/modals/view-box-items/ViewBoxItems";
import PageHeader from "~/shared/page-header/PageHeader";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import PoSectionTabs from "~/shared/purchase-order/components/PoSectionTabs";
import CreatePoFab from "~/shared/purchase-order/components/CreatePoFab";
import PoActionButtons from "~/shared/purchase-order/components/PoActionButtons";
import MobileView from "./components/MobileView";
import MobileViewTheme2 from "./components/MobileViewTheme2";
import { useSearchParams } from "react-router";
import { ScanLine } from "lucide-react";
import useAppNav from "~/hooks/useAppNav";
import { FormProvider, useForm } from "react-hook-form";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["PURCHASE-ORDER.PO-VIEW-ORDERS"]);
}

/**
 * Feed filter. The status bucket is not part of it — this page is waiting-only
 * (see `prepareFilterParams`), so search is the only user-facing filter left.
 */
interface FilterState {
  search?: string;
  feature?: string;
  purchasedFrom?: string;
}

const defaultFilter: FilterState = {
  search: "",
  feature: "purchase",
  purchasedFrom: "All",
};

const NotReceivedPo = () => {
  const { t } = useTranslation(["common", "menu"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";
  const appNav = useAppNav();

  const formMethods = useForm<FilterState>({
    defaultValues: {
      ...defaultFilter,
    },
  });

  const [busyLoader, setBusyLoader] = useState<{ show: boolean; msg?: string }>(
    { show: false, msg: "" },
  );

  const [view, setView] = useState<ViewToggleType>("list");

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const filterRef = useRef<FilterState>({ ...defaultFilter });

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

  const [viewBoxItemsModal, setViewBoxItemsModal] = useState<{
    show: boolean;
    boxId?: string | null;
  }>({
    show: false,
    boxId: null,
  });

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    {
      label: t("purchaseOrders"),
      redirect: { path: "/dashboard/purchase-order/main" },
    },
    { label: t("yetToReceive") },
  ];

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const ordersData = await getData(params);

      setOrders(ordersData);
      setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);

      const currentStart = paginationRef.current.startSlNo;
      const currentEnd = Math.min(
        currentStart + ordersData.length - 1,
        paginationRef.current.totalRecords,
      );
      paginationRef.current.endSlNo = currentEnd;
    } catch (error) {
      console.error("Error loading not-received POs:", error);
      setOrders([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;

    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };

      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const ordersData = await getData(params);

      setOrders((prev) => [...prev, ...ordersData]);
      setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);

      const newEnd = Math.min(
        paginationRef.current.endSlNo + ordersData.length,
        paginationRef.current.totalRecords,
      );
      paginationRef.current.endSlNo = newEnd;
    } catch (error) {
      console.error("Error loading more not-received POs:", error);
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setLoadingTotalRecords(true);
    setOrders([]);

    const params = prepareFilterParams(
      filterRef.current,
      paginationRef.current,
      sortRef.current,
    );

    try {
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
    } finally {
      setLoadingTotalRecords(false);
      setLoading(false);
    }

    await loadList();
  }, [loadList]);

  // Filter changes are not applied directly — they are written to the URL and
  // the searchParams effect below reloads the feed. Keeps the filter state
  // shareable/back-navigable and gives a single load path.
  const handleFilterChange = useCallback(
    (filterData: Partial<FilterState>) => {
      setSearchParams(
        prepareFilterQueryParams({ ...filterRef.current, ...filterData }),
      );
    },
    [setSearchParams],
  );

  const handleReceived = useCallback(
    (index: number) => {
      // Immediately update local state to remove the received box by index
      if (index >= 0) {
        setOrders((prevOrders) => prevOrders.filter((_, i) => i !== index));
      }
      // Then reload from server to ensure consistency
      applyFilter();
    },
    [applyFilter],
  );

  // Callback to handle actions coming from Desktop/Mobile view. Receiving
  // itself is owned by the shared ReceiveBoxFlow those views wrap their button
  // in; they only report back once a package is actually received.
  const handleRowAction = useCallback(
    async (a: { action: string; data: any; index?: number }) => {
      if (a.action === "received") {
        handleReceived(a.index ?? -1);
      } else if (a.action === "view-items") {
        // Explicitly open box items modal when user taps the view (Eye) button
        setViewBoxItemsModal({
          show: true,
          boxId: a.data?.refNo || a.data?._id,
        });
      }
    },
    [handleReceived],
  );

  // Single load path: the URL owns the filter state. Any change (search, date
  // range, status chip) rewrites the query params, which lands back here.
  useEffect(() => {
    const filter: FilterState = {
      ...defaultFilter,
      search: searchParams.get("search") || defaultFilter.search,
      purchasedFrom:
        searchParams.get("purchasedFrom") || defaultFilter.purchasedFrom,
    };

    filterRef.current = filter;

    formMethods.setValue("search", filter.search || "");
    formMethods.setValue("purchasedFrom", filter.purchasedFrom);

    applyFilter();
  }, [searchParams, formMethods, applyFilter]);

  return (
    <>
      <AppHeader
        sectionKey="supply"
        activeTab="receive-stock"
        mobileLead="menu"
        title={isTheme2 ? "Inward" : t("purchaseOrders")}
        subtitle={
          isTheme2 && !loadingTotalRecords
            ? `${paginationRef.current.totalRecords} waiting · scan to receive`
            : undefined
        }
        showAudioNote={true}
        audioNoteTitle={t("purchaseOrders")}
        audioFeature="po"
        renderActions={
          <button
            type="button"
            onClick={() => appNav.to("/dashboard/purchase-order/box-receive")}
            title="Scan box"
            aria-label="Scan box"
            className="tw:inline-flex tw:size-11 tw:-mr-1 tw:items-center tw:justify-center tw:rounded-full tw:cursor-pointer tw:bg-white/15! tw:hover:bg-white/25!"
          >
            <ScanLine className="tw:size-7" />
          </button>
        }
      />
      <div className="page-bg app-page tw:p-4">
        {/* PO tab bar — theme-2 mobile only (see theme-2.css). */}
        <PoSectionTabs activeTab="boxes" outerClassName="tw:mb-3" />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="receive-stock"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main feed column — spans the full grid in theme-2 desktop
                    because the side pane is lifted into the fixed rail panel. */}
              <AppPaneMain className="tw:lg:col-span-12 tw:space-y-0">
                {/* Hidden in theme-2 at every breakpoint — the app header
                    already shows "Inward", so this would be a second copy of
                    the same title on the page. */}
                <div className="theme-2-hide tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2 tw:mb-4">
                  <PageHeader
                    breadcrumbs={defaultBreadcrumbs}
                    title={t("yetToReceive")}
                    description="purchaseOrder.yetToReceive"
                  />
                  {!isTheme2 && <PoActionButtons />}
                </div>

                {!isTheme2 && (
                  <PoListTabs activeTab="receive-orders" className="tw:mb-4" />
                )}

                {/* Scan banners — box scan + AI invoice scan, side by side.
                  Desktop only: on mobile they push the feed below the fold, and
                  in the theme-2 desktop split pane the same banners move into
                  the fixed side pane. */}
                {!isMobile && (
                  <PoScanBanners className="app-pane-hide tw:mb-4" />
                )}

                <div>
                  <FormProvider {...formMethods}>
                    <Filter
                      onFilterChange={handleFilterChange}
                      feature={filterRef.current.feature || "purchase"}
                      className="tw:mb-4"
                    />
                  </FormProvider>
                  <div className="tw:flex tw:justify-between tw:items-end tw:mb-3">
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
                </div>

                {orders.length === 0 && !loading ? (
                  <AppCard>
                    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-12 tw:text-gray-500">
                      <div>{t("noPurchaseOrdersFound")}</div>
                      <div className="tw:text-xs tw:mt-1">
                        {t("tryAdjustingFilters")}
                      </div>
                    </div>
                  </AppCard>
                ) : isMobile || view == "card" ? (
                  <>
                    {isTheme2 ? (
                      <MobileViewTheme2
                        data={orders}
                        callback={handleRowAction}
                        loading={loading}
                        showLoadMore={hasMoreData}
                        loadMore={loadMore}
                        loadingMore={loadingMore}
                        totalCount={paginationRef.current.totalRecords}
                      />
                    ) : (
                      <MobileView
                        data={orders}
                        callback={handleRowAction}
                        loading={loading}
                        showLoadMore={hasMoreData}
                        loadMore={loadMore}
                        loadingMore={loadingMore}
                        totalCount={paginationRef.current.totalRecords}
                      />
                    )}
                  </>
                ) : (
                  <AppCard noPadding>
                    <DesktopView
                      data={orders}
                      callback={handleRowAction}
                      tab={"receive-orders"}
                      sortKey={sortRef.current.key}
                      sortValue={sortRef.current.value || "desc"}
                      sortCb={() => {}}
                      loading={loading}
                      showLoadMore={hasMoreData}
                      loadingMore={loadingMore}
                      loadMore={loadMore}
                      totalCount={paginationRef.current.totalRecords}
                    />
                  </AppCard>
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
      <CreatePoFab />

      <ViewBoxItemsModal
        show={viewBoxItemsModal.show}
        callback={(a: { action: string; data?: any }) => {
          setViewBoxItemsModal({ show: false, boxId: null });
          // Inwarded from inside the details modal — drop it from the waiting
          // feed the same way a row-level receive does.
          if (a.action === "received") handleReceived(-1);
        }}
        boxId={viewBoxItemsModal.boxId}
        allowReceive
      />

      <BusyLoader show={busyLoader.show} message={busyLoader.msg} />
    </>
  );
};

export default NotReceivedPo;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Purchase Orders - Yet to Receive",
      ),
    },
  ];
}
