import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem, ViewToggleType } from "~/types/CommonTypes";
import ManagePriceTabs from "../../components/ManagePriceTabs";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import Table from "./components/Table";
import { getCount, getData, prepareParams } from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CONFIGS.PRICING"]);
}

const RspHistory = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Dashboard",
      redirect: { path: "/dashboard" },
    },
    {
      label: "Manage Price",
      redirect: { path: "/configs/rsp" },
    },
    {
      label: t("pricingHistory"),
    },
  ];

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");

  // State and refs for filter, pagination, and data
  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 20,
    totalRecords: 0,
    startSlNo: 1,
    endSlNo: 20,
  });

  // Apply filter and fetch data
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setLoadingTotalRecords(true);
    setData([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "createdAt",
        value: "desc",
      });
      // Fetch total count
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const items = await getData(params);
      setData(items);
      setHasMoreData(items.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      setData([]);
      setHasMoreData(false);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
      setLoadingTotalRecords(false);
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (filters: { formData: any }) => {
      const newFilterData = filters.formData;
      filterRef.current = newFilterData;
      applyFilter();
    },
    [applyFilter],
  );

  // Call applyFilter on mount
  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load more data for pagination
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
        const params = prepareParams(filterRef.current, paginationRef.current, {
          key: "createdAt",
          value: "desc",
        });
        const items = await getData(params);
        setData((prev) => [...prev, ...items]);
        setHasMoreData(items.length >= paginationRef.current.rowsPerPage);
      } catch (error) {
        // handle error
      } finally {
        setLoadingMore(false);
        if (event?.target) event.target.complete();
      }
    },
    [loadingMore, hasMoreData],
  );

  return (
    <>
      <AppHeader title="Manage Price" />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <ManagePriceTabs activeTab="history" className="tw:mb-4" />

          <AppCard title={t("recentPriceChanges")}>
            <Filter callback={handleFilterChange} />
            <div className="tw:flex tw:justify-between tw:items-end tw:mb-4">
              <div>
                <PaginationSummary
                  paginationConfig={paginationRef.current}
                  loadingTotalRecords={loadingTotalRecords}
                  loadedCount={data.length}
                  fwSize="sm"
                />
              </div>
              <ViewToggle viewType={view} callback={setView} />
            </div>
            {isMobile || view === "card" ? (
              <>
                <MobileView data={data} />
                {/* Mobile load more */}
                {hasMoreData && !loading && (
                  <div className="tw:flex tw:justify-center tw:my-4">
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
              <Table
                data={data}
                loading={loading}
                loadedCount={data.length}
                totalCount={paginationRef.current.totalRecords}
                showLoadMore={hasMoreData}
                loadingMore={loadingMore}
                loadMore={loadMore}
              />
            )}
          </AppCard>
        </div>
      </div>
    </>
  );
};

export default RspHistory;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Products Price History"),
    },
  ];
}
