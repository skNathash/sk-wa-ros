import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useDebouncedCallback } from "use-debounce";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PageDescription from "~/components/core/page-description/PageDescription";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import PageAccessService from "~/services/PageAccessService";
import PrintPosOrderService from "~/services/PrintPosOrderService";
import FulfillmentSidePane from "~/shared/fulfillment/components/fulfillment-side-pane/FulfillmentSidePane";
import PaymentApprovedList from "~/shared/fulfillment/components/fulfillment-side-pane/PaymentApprovedList";
import { PAYMENT_APPROVAL_FROM_PARAM } from "~/shared/fulfillment/components/fulfillment-side-pane/paymentApprovalHelper";
import PaymentPendingList from "~/shared/fulfillment/components/fulfillment-side-pane/PaymentPendingList";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import RoutesSlider from "~/shared/logistics/components/RoutesSlider";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import OrderListTab from "~/shared/orders/order-list-tab/OrderListTab";
import OrderTopBar from "~/shared/orders/order-top-bar/OrderTopBar";
import type {
  BreadcrumbItem,
  PaginationState,
  SortValue,
  ViewToggleType,
} from "~/types/CommonTypes";
import type { OrderTabsType } from "../components/tabs/OrderTabs";
import AppliedFilters from "./components/AppliedFilters";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import MobileViewTheme2 from "./components/MobileViewTheme2";
import Summary from "./components/Summary";
import {
  defaultFilter,
  type FilterFormData,
  getCount,
  getData,
  prepareFilterQueryParams,
  prepareParams,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["SALE-ORDER.VIEW-ORDERS"]);
}

const getBreadcrumbAndTitle = (
  activeTab: OrderTabsType,
  t: (key: string) => string,
) => {
  let breadcrumbLabel = "Orders";
  let titleKey = "ordersManagement";
  let descriptionKey = "manageOrder";

  switch (activeTab) {
    case "my-orders":
      breadcrumbLabel = "Retailers Purchase";
      titleKey = "purchaseFromNetwork";
      break;
    case "b2b-orders":
      breadcrumbLabel = "B2B Orders";
      titleKey = "b2bOrders";
      break;
    case "b2c-orders":
      breadcrumbLabel = "B2C Orders";
      titleKey = "b2cOrders";
      break;
    case "receive-order":
      breadcrumbLabel = "Receive Orders";
      titleKey = "receiveOrders";
      break;
    case "unconfirmed-orders":
      breadcrumbLabel = "Unconfirmed Orders";
      titleKey = "unconfirmedOrders";
      descriptionKey = "unconfirmedOrders";
      break;
    case "payment-approval":
      breadcrumbLabel = "Payment Approval";
      titleKey = "paymentApproval";
      break;
    case "coinstore-orders":
      breadcrumbLabel = "Coin Store Orders";
      titleKey = "coinStoreOrders";
      break;
    case "pending-settlement":
      breadcrumbLabel = "Pending Settlement";
      titleKey = "pendingSettlement";
      break;
    default:
      break;
  }

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Dashboard",
    },
    {
      label: breadcrumbLabel,
      langKey: titleKey,
    },
  ];

  return { breadcrumbs, titleKey, descriptionKey };
};

const OrdersList = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";

  const appNav = useAppNav();

  const { show: appToast } = useAppToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm<FilterFormData>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [busyloader, setBusyloader] = useState<{ show: boolean }>({
    show: false,
  });

  const activeTab = (searchParams.get("tab") as OrderTabsType) || "b2c-orders";

  const isPaymentApproval = activeTab === "payment-approval";

  const { breadcrumbs, titleKey, descriptionKey } = getBreadcrumbAndTitle(
    activeTab,
    t,
  );

  const [summary, setSummary] = useState<{
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    uniqueCustomers: number;
  }>({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    uniqueCustomers: 0,
  });

  const [view, setView] = useState<ViewToggleType>("list");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "orderedDate",
    value: "desc",
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );

      const result = await getData(params, formMethods.getValues().type);

      setData(result || []);

      const countResult = await getCount(params, formMethods.getValues().type);
      paginationRef.current.totalRecords = countResult.totalOrders;

      setSummary({
        totalOrders: countResult.totalOrders,
        totalRevenue: countResult.totalRevenue || 0,
        avgOrderValue: countResult.avgOrderValue || 0,
        uniqueCustomers: countResult.uniqueCustomers || 0,
      });

      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
      setSummary({
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        uniqueCustomers: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params, formMethods.getValues().type);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const status = searchParams.get("status") || "all";
    const orderSubType =
      searchParams.get("orderSubType") || defaultFilter.orderSubType;
    const paymentMethod = searchParams.get("paymentMethod") || "all";
    const paymentStatus = searchParams.get("paymentStatus") || "all";
    const routeId = searchParams.get("routeId") || "all";

    formMethods.setValue("search", search);
    if (dateFrom && dateTo) {
      formMethods.setValue("dateRange", [
        new Date(dateFrom),
        new Date(dateTo),
      ] as Date[]);
    } else {
      formMethods.setValue("dateRange", defaultFilter.dateRange);
    }
    formMethods.setValue("status", status || defaultFilter.status);
    formMethods.setValue(
      "paymentMethod",
      paymentMethod || defaultFilter.paymentMethod,
    );
    formMethods.setValue(
      "paymentStatus",
      paymentStatus || (defaultFilter as any).paymentStatus,
    );
    formMethods.setValue("routeId", routeId || defaultFilter.routeId);
    // Ensure orderSubType from URL is respected in the filter form
    formMethods.setValue("orderSubType", orderSubType);
    formMethods.setValue("type", activeTab);

    applyFilter();
  }, [searchParams, activeTab, applyFilter]);

  // Callback for item actions (view, download, etc)
  const handleItemCallback = async ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "view-order") {
      // Opening an order from the payment-approval queue carries the tab along
      // so the detail page keeps the payment blocks beside it.
      appNav.to(
        `/dashboard/orders/view/${data.orderId}`,
        isPaymentApproval ? { from: PAYMENT_APPROVAL_FROM_PARAM } : undefined,
      );
    } else if (action === "print-invoice") {
      setBusyloader({ show: true });
      const response = await OmsService.getSellerOrderDetail(data.orderId);
      const order = response?.data?.data || {};
      PrintPosOrderService.prepareTemplateData(order);
      setBusyloader({ show: false });
    } else if (action === "download-invoice") {
      if (!data.invoices || data.invoices.length === 0) {
        appToast({
          msg: t("noInvoicesAvailable"),
          color: "danger",
        });
        return;
      }

      // Download the first invoice (you can modify this logic if you want to download all invoices)
      const firstInvoice = data.invoices[0];
      const invoiceDocumentId = firstInvoice.invoiceDocumentId;

      if (invoiceDocumentId) {
        // Use common service to download/open the asset similar to pick list download
        CommonService.assetDownload(invoiceDocumentId);
        appToast({
          msg: t("downloadingInvoice"),
          color: "success",
        });
      } else {
        appToast({
          msg: t("invoiceDocumentNotFound"),
          color: "danger",
        });
      }
    }
    // Add more actions if needed
  };

  const handleSort = useCallback(
    ({ key, value }: { key: string; value: SortValue }) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter],
  );

  // Top-bar search — writes the term to the URL the same way the filter does,
  // so the list reloads through the same `searchParams` effect.
  const applySearch = useDebouncedCallback(() => {
    setSearchParams(
      prepareFilterQueryParams(formMethods.getValues(), activeTab),
    );
  }, 500);

  const handleSearchChange = (value: string) => {
    formMethods.setValue("search", value);
    applySearch();
  };

  return (
    <>
      <AppHeader
        sectionKey="bill"
        activeTab="orders"
        mobileLead="menu"
        title={t(titleKey)}
        showCart={true}
        showAudioNote={true}
        audioNoteTitle={t(titleKey)}
        audioFeature="manageOrders"
      />
      <div className="page-bg app-page page-padding">
        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu sectionKey="bill" activeTab="orders" title="Bill" />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane). */}
              <AppPaneMain className="tw:lg:col-span-12">
                {/* Board / Directory / Analytics + the order search on one
                    white strip under the header — the filter button rides
                    along beside the search. */}
                <OrderTopBar
                  activeView="directory"
                  searchValue={formMethods.watch("search")}
                  onSearchChange={handleSearchChange}
                  searchPlaceholder={t("searchIdNameProduct")}
                  actions={
                    <FormProvider {...formMethods}>
                      <Filter showSearch={false} className="" />
                    </FormProvider>
                  }
                >
                  {/* The order-channel tabs ride inside the same white strip,
                      right under the view switcher + search row. Pills in
                      theme-2, the classic segmented control elsewhere. */}
                  {!searchParams.get("hideTab") && (
                    <OrderListTab
                      activeTab={activeTab}
                      className="app-pane-hide"
                      variant={isTheme2 ? "pills" : undefined}
                    />
                  )}
                </OrderTopBar>

                <div className="hide-in-theme-2 tw:flex tw:flex-col tw:md:flex-row tw:items-center tw:justify-between tw:gap-4">
                  <div>
                    <AppBreadcrumbs data={breadcrumbs} />
                    <PageDescription
                      description={descriptionKey}
                      className="tw:mb-4"
                    />
                  </div>
                </div>

                {activeTab !== "b2c-orders" && activeTab !== "my-orders" && (
                  <RoutesSlider
                    selectedId={formMethods.watch("routeId")}
                    callback={({ action, data }) => {
                      if (action === "select") {
                        formMethods.setValue("routeId", data._id);
                        const currentParams = prepareFilterQueryParams(
                          formMethods.getValues(),
                          activeTab,
                        );
                        currentParams.routeId = data._id;
                        setSearchParams(currentParams);
                      }
                    }}
                    className="tw:mb-2"
                  />
                )}

                {activeTab !== "my-orders" && <Summary summary={summary} />}

                {/* <PaymentModeSummary /> */}

                {/* The search + filter button moved up into the top bar; what
                    the modal applied still lists here. */}
                <FormProvider {...formMethods}>
                  <AppliedFilters />
                </FormProvider>

                {/* Single controls block (pagination summary + view toggle) placed after filter */}
                <div className="tw:flex tw:items-center tw:mt-2 tw:mx-0 tw:mb-4">
                  <div className="tw:flex-1">
                    <PaginationSummary
                      paginationConfig={paginationRef.current}
                      loadingTotalRecords={loading}
                      loadedCount={data?.length || 0}
                      fwSize="sm"
                    />
                  </div>
                  <ViewToggle viewType={view} callback={setView} />
                </div>

                {/* Controls and list: show AppCard only for desktop/tablet view. For mobile/card view render without AppCard. */}
                {isMobile || view === "card" ? (
                  <>
                    {/* Theme-2 gets its own minimal, edge-to-edge order rows;
                        the classic theme keeps the detailed cards. */}
                    {isTheme2 ? (
                      <MobileViewTheme2
                        data={data}
                        loading={loading}
                        callback={handleItemCallback}
                        activeTab={activeTab}
                      />
                    ) : (
                      <MobileView
                        data={data}
                        loading={loading}
                        callback={handleItemCallback}
                        activeTab={activeTab}
                      />
                    )}

                    {hasMoreData && !loading && (
                      <div className="tw:text-center tw:mt-4">
                        <LoadMoreButton
                          loadMore={loadMore}
                          loading={loadingMore}
                          totalCount={paginationRef.current.totalRecords}
                          loadedCount={data.length}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <AppCard noPadding={true}>
                    <DesktopView
                      data={data}
                      loading={loading}
                      callback={handleItemCallback}
                      sortKey={sortRef.current?.key}
                      sortValue={sortRef.current?.value}
                      onSort={handleSort}
                      activeTab={activeTab}
                      loadMore={loadMore}
                      loadingMore={loadingMore}
                      totalCount={paginationRef.current.totalRecords}
                      loadedCount={data.length}
                      hasMoreData={hasMoreData}
                    />
                  </AppCard>
                )}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed pane
                  beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <FulfillmentSidePane
                  title={t(titleKey)}
                  subtitle={
                    summary.totalOrders
                      ? `${summary.totalOrders} orders`
                      : undefined
                  }
                  chipType="order-channel"
                  showStages={!isPaymentApproval}
                />

                {/* On the payment-approval tab the pipeline stages give way to
                    what the person verifying payments actually needs beside
                    the list — what is still waiting, and what just cleared. */}
                {isPaymentApproval && (
                  <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-4">
                    <PaymentPendingList />
                    <PaymentApprovedList />
                  </div>
                )}
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      <BusyLoader show={busyloader.show} />
    </>
  );
};

export default OrdersList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Orders"),
    },
  ];
}
