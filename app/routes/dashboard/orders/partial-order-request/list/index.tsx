import { useEffect, useRef, useState } from "react";
import AppHeader from "~/components/core/header/AppHeader";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";

import {
  defaultFilter,
  prepareParams,
  getData,
  type FilterFormData,
  getCount,
  getSummary,
  defaultSummary as defaultSummaryData,
} from "./helper";
import { FormProvider, useForm } from "react-hook-form";
import Filter from "./components/Filter";
import Summary from "./components/Summary";
import useScreenView from "~/hooks/useScreenView";
import { format } from "date-fns";
import MobileView from "./components/MobileView";
import DesktopView from "./components/DesktopView";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { useSearchParams } from "react-router";
import OrderListTab from "~/shared/orders/order-list-tab/OrderListTab";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import type { BreadcrumbItem } from "~/types/CommonTypes";

const PartialOrderRequestList = () => {
  const { isMobile } = useScreenView();
  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm<FilterFormData>({ defaultValues: defaultFilter });

  const [data, setData] = useState<any[]>([]);
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

  const [summary, setSummary] = useState<any>(
    defaultSummaryData.reduce((acc, curr) => ({ ...acc, [curr.key]: 0 }), {}),
  );

  const applyFilter = async () => {
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

      const countResult = await getCount(params);
      paginationRef.current.totalRecords = countResult || 0;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  };

  const updateSummary = async () => {
    try {
      const summaryData = await getSummary(formMethods.getValues());
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to fetch summary", error);
    }
  };

  const loadMore = async () => {
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
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    formMethods.setValue("search", search);
    formMethods.setValue("status", status);

    const dateRange: Date[] = [];
    if (dateFrom) dateRange.push(new Date(dateFrom));
    if (dateTo) dateRange.push(new Date(dateTo));

    if (dateRange.length > 0) {
      formMethods.setValue("dateRange", dateRange);
    } else {
      formMethods.setValue("dateRange", []);
    }

    applyFilter();
    updateSummary();
  }, [searchParams]);

  const handleFilterCb = (args: {
    action: string;
    data?: Record<string, any>;
  }) => {
    if (args.action === "filter") {
      const { search, status, dateRange } = args.data || {};
      let params = new URLSearchParams();
      if (search) {
        params.set("search", search);
      }
      if (status && status !== "all") {
        params.set("status", status);
      }
      if (dateRange && dateRange[0]) {
        params.set("dateFrom", format(dateRange[0], "yyyy-MM-dd"));
      }
      if (dateRange && dateRange[1]) {
        params.set("dateTo", format(dateRange[1], "yyyy-MM-dd"));
      }
      setSearchParams(params, { replace: true });
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Dashboard",
    },
    {
      label: "Orders",
    },
    {
      label: "Reservation Requests",
      langKey: "orderRequests",
    },
  ];

  return (
    <>
      <AppHeader title="Reservation Requests" />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          <OrderListTab activeTab="order-requests" className="tw:mb-4" />

          <Summary summary={summary} />

          <FormProvider {...formMethods}>
            <Filter callback={handleFilterCb} />
          </FormProvider>
          <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
            <div className="tw:flex-1">
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loading}
                loadedCount={data.length}
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
                showLoadMore={hasMoreData}
              />
            </AppCard>
          )}
        </div>
      </div>
    </>
  );
};

export default PartialOrderRequestList;
