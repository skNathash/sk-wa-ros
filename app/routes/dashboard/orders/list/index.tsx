import { BarChart2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PageDescription from "~/components/core/page-description/PageDescription";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import PageAccessService from "~/services/PageAccessService";
import PrintPosOrderService from "~/services/PrintPosOrderService";
import RoutesSlider from "~/shared/logistics/components/RoutesSlider";
import OrderListTab from "~/shared/orders/order-list-tab/OrderListTab";
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
      appNav.to(`/dashboard/orders/view/${data.orderId}`);
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

  return (
    <>
      <AppHeader
        title={t(titleKey)}
        showCart={true}
        showAudioNote={true}
        audioNoteTitle={t(titleKey)}
        audioFeature="manageOrders"
      />
      <div className="tw:p-4 app-page page-bg">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-center tw:justify-between tw:gap-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} />
              <PageDescription
                description={descriptionKey}
                className="tw:mb-4"
              />
            </div>
          </div>

          {!searchParams.get("hideTab") && (
            <OrderListTab activeTab={activeTab} className="tw:mb-4" />
          )}

          {activeTab !== "b2c-orders" && (
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

          <FormProvider {...formMethods}>
            <Filter />
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
              <MobileView
                data={data}
                loading={loading}
                callback={handleItemCallback}
                activeTab={activeTab}
              />

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
