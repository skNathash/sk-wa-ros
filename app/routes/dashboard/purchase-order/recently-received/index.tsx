import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import { useSearchParams } from "react-router";
import { FormProvider, useForm } from "react-hook-form";
import useScreenView from "~/hooks/useScreenView";
import type {
  BreadcrumbItem,
  TabItem,
  SortValue,
  ViewToggleType,
} from "~/types/CommonTypes";
import useTheme from "~/hooks/useTheme";
import PoListTabs from "../components/tabs/PoListTabs";
import Filter from "./components/Filter";
import FilterChips from "./components/FilterChips";
import ProductMobileView from "./components/product/ProductMobileView";
import ProductTable from "./components/product/ProductTable";
// import Summary from "./components/Summary";
import VendorMobileView from "./components/vendor/VendorMobileView";
import VendorTable from "./components/vendor/VendorTable";
import {
  getCount,
  getData,
  prepareParams,
  defaultFilterData,
  // getSummary,
} from "./helpers";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import BoxMobileView from "./components/box/BoxMobileView";
import BoxDesktopView from "./components/box/BoxDesktopView.";
import PageHeader from "~/shared/page-header/PageHeader";
import ViewBoxItemsModal from "~/shared/orders/receive-box/modals/view-box-items/ViewBoxItems";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import PoSectionTabs from "~/shared/purchase-order/components/PoSectionTabs";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import CreatePoFab from "~/shared/purchase-order/components/CreatePoFab";
import PoActionButtons from "~/shared/purchase-order/components/PoActionButtons";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";
import { AuthService } from "~/services/AuthService";

const tabItems: TabItem[] = [
  { key: "by-box", name: "By Box", langKey: "byBox" },
  { key: "by-product", name: "By Product", langKey: "byProduct" },
  {
    key: "by-vendor",
    name: "By Vendor/Seller",
    langKey: "byVendorSeller",
  },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Purchase Orders",
    langKey: "purchaseOrders",
    redirect: {
      path: "/dashboard/purchase-order/main",
      params: {},
    },
  },
  {
    label: "Recently Received",
    langKey: "recentlyReceived",
  },
];

const RecentlyReceivedPage = () => {
  const { t } = useTranslation(["common", "menu"]);

  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  const [boxModal, setBoxModal] = useState<{ show: boolean; data: any | null }>(
    {
      show: false,
      data: null,
    }
  );

  // create form methods to pass to Filter via FormProvider
  const methods = useForm({ defaultValues: { ...(defaultFilterData as any) } });

  const [view, setView] = useState<ViewToggleType>("list");

  const [activeTab, setActiveTab] = useState<string>("by-box");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // const [summary, setSummary] = useState<{
  //   totalDeals?: number;
  //   totalOrderedQty?: number;
  //   totalReceivedQty?: number;
  //   totalDamagedQty?: number;
  //   totalShortageQty?: number;
  //   totalCost?: number;
  //   averageFulfillment?: number;
  //   totalBoxes?: number;
  // }>({});

  // Filter and pagination refs
  const filterRef = useRef<any>({ ...defaultFilterData });
  const paginationRef = useRef<any>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  // Sort ref for sorting functionality
  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "receivedDate",
    value: "desc",
  });

  useEffect(() => {
    // On load: pick query params from url and update the filterRef
    // Map known params from searchParams to filterRef (merge with defaults)
    const qp: any = {};
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) {
      qp.dateRange = [new Date(from), new Date(to)];
    }
    const search = searchParams.get("search");
    if (search) qp.search = search;
    // received query param removed
    const alpha = searchParams.get("alpha");
    qp.alpha = alpha || "";
    const activeTabQP = searchParams.get("activeTab");
    if (activeTabQP) {
      qp.activeTab = activeTabQP;
      setActiveTab(activeTabQP);
    }

    filterRef.current = { ...filterRef.current, ...qp };
    methods.reset({ ...(filterRef.current as any) });
    applyFilter();
  }, [searchParams]);

  // Apply filter and fetch data
  const applyFilter = useCallback(async (canLoadSummary: boolean = true) => {
    setLoading(true);
    setOrders([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const { count, summary: countSummary } = await getCount(params);
      paginationRef.current.totalRecords = count;

      // if (canLoadSummary) {
      //   const summaryObj: any = await getSummary(params);

      //   const mappedSummary: any = {
      //     totalDeals: Number(summaryObj.orders) || 0,
      //     totalCost: Number(summaryObj.totalValue) || 0,
      //     totalReceivedQty: Number(summaryObj.items) || 0,
      //     totalDamagedQty: Number(summaryObj.damaged) || 0,
      //     totalShortageQty: Number(summaryObj.shortage) || 0,
      //     totalBoxes: Number(summaryObj.boxes) || 0,
      //   };

      //   setSummary(mappedSummary);
      // }
      const ordersData = await getData(params);
      setOrders(ordersData);
      setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error(error);
      setOrders([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more for infinite scroll
  const loadMore = useCallback(
    async (event?: any) => {
      if (loadingMore || !hasMoreData) {
        if (event?.target) event.target.complete();
        return;
      }
      setLoadingMore(true);
      try {
        paginationRef.current = {
          ...paginationRef.current,
          activePage: paginationRef.current.activePage + 1,
        };
        const params = prepareParams(
          filterRef.current,
          paginationRef.current,
          sortRef.current
        );
        const ordersData = await getData(params);
        setOrders((prev) => [...prev, ...ordersData]);
        setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);
      } catch (error) {
        setHasMoreData(false);
      } finally {
        setLoadingMore(false);
        if (event?.target) event.target.complete();
      }
    },
    [loadingMore, hasMoreData]
  );

  const handleTabChange = useCallback(
    (tab: TabItem) => {
      const params: Record<string, any> = {};
      for (const [key, value] of Array.from(searchParams.entries())) {
        params[key] = value;
      }
      params.activeTab = tab.key;
      appNav.replace("/dashboard/purchase-order/recently-received", params);
    },
    [searchParams]
  );

  const handleFilterChange = (filters: any) => {
    filterRef.current = { ...filterRef.current, ...filters };
    const params: Record<string, any> = {};
    if (filterRef.current.search) params.search = filterRef.current.search;
    if (filterRef.current.alpha) params.alpha = filterRef.current.alpha;
    if (filterRef.current.activeTab)
      params.activeTab = filterRef.current.activeTab;

    if (
      Array.isArray(filterRef.current.dateRange) &&
      filterRef.current.dateRange.length === 2
    ) {
      const d0 = filterRef.current.dateRange[0];
      const d1 = filterRef.current.dateRange[1];
      params.from = d0 ? format(new Date(d0), "yyyy-MM-dd") : undefined;
      params.to = d1 ? format(new Date(d1), "yyyy-MM-dd") : undefined;
    }

    appNav.replace("/dashboard/purchase-order/recently-received", params);
  };

  const handleSort = useCallback(
    ({ key, value }: { key: string; value: SortValue }) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter]
  );

  const productItemCallback = (a: { action: string; data?: any }) => {
    if (a.action === "view" && a.data && a.data._id) {
      appNav.to("/dashboard/inventory/deal/" + a.data._id);
    }
  };

  const vendorItemCallback = (a: { action: string; data?: any }) => {
    if (a.action === "view" && a.data && a.data._id) {
      appNav.to("/dashboard/vendor/view/" + a.data._id);
    }
  };

  const boxItemCallback = (a: { action: string; data?: any }) => {
    if (a.action === "view" && a.data) {
      setBoxModal({ show: true, data: a.data });
    }
  };

  return (
    <>
      <AppHeader title={t("recentlyReceived")} />
      <div className="page-padding page-bg app-page">
        <div className="app-container">
          {/* PO tab bar — theme-2 mobile only (see theme-2.css). */}
          <PoSectionTabs outerClassName="tw:mb-3" />

          <div className="section-layout">
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
                <AppPaneMain className="tw:lg:col-span-12">
                  <div className="theme-2-mobile-hide tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2 tw:mb-4">
                    <PageHeader
                      breadcrumbs={breadcrumbs}
                      title={t("recentlyReceived")}
                      description="purchaseOrder"
                    />
                    <PoActionButtons />
                  </div>
                  {!isTheme2 && (
                    <PoListTabs
                      activeTab="recently-received"
                      className="tw:mb-4"
                    />
                  )}
                  {/* <Summary summary={summary} /> */}
                  <FilterChips
                    tabs={tabItems}
                    activeTab={activeTab}
                    onChange={handleTabChange}
                    className="tw:mb-4"
                  />

                  <div>
                    <FormProvider {...methods}>
                      <Filter
                        onFilterChange={handleFilterChange}
                        activeTab={activeTab}
                      />
                    </FormProvider>

                    <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
                      <div>
                        <PaginationSummary
                          paginationConfig={paginationRef.current}
                          loadingTotalRecords={loading}
                          loadedCount={orders.length}
                          fwSize="sm"
                        />
                      </div>

                      <ViewToggle viewType={view} callback={setView} />
                    </div>
                  </div>

                  {isMobile || view == "card" ? (
                    <>
                      {activeTab === "by-product" ? (
                        <ProductMobileView
                          data={orders}
                          callback={productItemCallback}
                          loading={loading}
                        />
                      ) : activeTab === "by-vendor" ? (
                        <VendorMobileView
                          data={orders}
                          callback={vendorItemCallback}
                          loading={loading}
                        />
                      ) : (
                        <BoxMobileView
                          data={orders}
                          loading={loading}
                          callback={boxItemCallback}
                        />
                      )}
                      {hasMoreData && !loading && (
                        <div className="tw:flex tw:justify-center tw:mt-4">
                          <LoadMoreButton
                            loadMore={loadMore}
                            loading={loadingMore}
                            totalCount={paginationRef.current.totalRecords}
                            loadedCount={orders.length}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <AppCard noPadding>
                      {activeTab === "by-product" ? (
                        <ProductTable
                          data={orders}
                          callback={productItemCallback}
                          sortKey={sortRef.current.key}
                          sortValue={sortRef.current.value}
                          onSort={handleSort}
                          loading={loading}
                          hasMoreData={hasMoreData}
                          loadMore={loadMore}
                          loadingMore={loadingMore}
                          totalCount={paginationRef.current.totalRecords}
                          loadedCount={orders.length}
                        />
                      ) : activeTab === "by-vendor" ? (
                        <VendorTable
                          data={orders}
                          callback={vendorItemCallback}
                          sortKey={sortRef.current.key}
                          sortValue={sortRef.current.value}
                          onSort={handleSort}
                          loading={loading}
                          hasMoreData={hasMoreData}
                          loadMore={loadMore}
                          loadingMore={loadingMore}
                          totalCount={paginationRef.current.totalRecords}
                          loadedCount={orders.length}
                        />
                      ) : (
                        <BoxDesktopView
                          data={orders}
                          sortKey={sortRef.current.key}
                          sortValue={sortRef.current.value}
                          onSort={handleSort}
                          loading={loading}
                          hasMoreData={hasMoreData}
                          loadMore={loadMore}
                          loadingMore={loadingMore}
                          totalCount={paginationRef.current.totalRecords}
                          loadedCount={orders.length}
                          callback={boxItemCallback}
                        />
                      )}
                    </AppCard>
                  )}
                </AppPaneMain>

                <AppPaneSide className="app-pane-only">
                  <PurchaseOrderSidePane />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ViewBoxItemsModal
        show={boxModal.show}
        callback={(e: { action: string; data?: any }) => {
          if (e.action === "close")
            setBoxModal((prev) => ({ ...prev, show: false }));
        }}
        boxId={boxModal.data?.refNo}
      />

      <CreatePoFab />
    </>
  );
};

export default RecentlyReceivedPage;
