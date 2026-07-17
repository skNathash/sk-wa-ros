import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import type {
  BreadcrumbItem,
  PaginationState,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import Summary from "./components/Summary";
import {
  defaultFilter,
  type FilterFormData,
  getCount,
  getData,
  getSummary,
  prepareParams,
} from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard" },
  { label: "Orders" },
  { label: "Order Refunds", langKey: "orderRefunds" },
];

const RefundsList = () => {
  const { isMobile } = useScreenView();
  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm<FilterFormData>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    refundedCount: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [view, setView] = useState<ViewToggleType>("list");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
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
      );
      const result = await getData(params);
      setData(result || []);
      const total = await getCount(params);
      paginationRef.current.totalRecords = total || 0;
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
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
      const params = prepareParams(
        formMethods.getValues(),
        paginationRef.current,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const status = searchParams.get("status") || "all";

    formMethods.setValue("search", search);
    formMethods.setValue("status", status);
    if (dateFrom && dateTo) {
      formMethods.setValue("dateRange", [
        new Date(dateFrom),
        new Date(dateTo),
      ]);
    } else {
      formMethods.setValue("dateRange", []);
    }

    applyFilter();
    getSummary(formMethods.getValues()).then(setSummary);
  }, [searchParams, applyFilter]);

  const handleFilterCb = (args: {
    action: string;
    data?: Record<string, any>;
  }) => {
    if (args.action !== "filter") return;
    const { search, dateRange, status } = args.data || {};
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status && status !== "all") params.set("status", status);
    if (dateRange && dateRange[0]) {
      params.set("dateFrom", format(dateRange[0], "yyyy-MM-dd"));
    }
    if (dateRange && dateRange[1]) {
      params.set("dateTo", format(dateRange[1], "yyyy-MM-dd"));
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <>
      <AppHeader title="Order Refunds" />
      <div className="tw:p-4 app-page page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          <PageDescription description="pendingSettlement" className="tw:mb-4" />

          <Summary summary={summary} />

          <FormProvider {...formMethods}>
            <Filter callback={handleFilterCb} />
          </FormProvider>

          <div className="tw:flex tw:items-center tw:mb-4">
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

          {isMobile || view === "card" ? (
            <MobileView
              data={data}
              loading={loading}
              loadMore={loadMore}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              showLoadMore={hasMoreData}
            />
          ) : (
            <AppCard noPadding>
              <DesktopView
                data={data}
                loading={loading}
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
    </>
  );
};

export default RefundsList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Order Refunds"),
    },
  ];
}
