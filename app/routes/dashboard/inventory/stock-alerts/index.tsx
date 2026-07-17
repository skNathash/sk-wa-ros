import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import InventoryMainSummary from "../components/main-summary/InventoryMainSummary";
import StockAlertSummary from "./components/Summary";
import InventoryTab from "../components/tab/InventoryTab";
import Table from "./components/Table";
import useScreenView from "~/hooks/useScreenView";
import AppButton from "~/components/core/button/AppButton";
import Filter from "./components/Filter";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import MobileView from "./components/MobileView";
import useAppNav from "~/hooks/useAppNav";

const defaultBreadcrumbs = [
  { label: "Dashboard", url: "/dashboard" },
  { label: "Inventory" },
];

const defaultFilter = {
  search: "",
  dateRange: null,
  status: "",
};

const StockAlerts = () => {
  const appNav = useAppNav();

  const { isMobile } = useScreenView();
  const [breadcrumbs] = useState(defaultBreadcrumbs);
  const [title] = useState("Items");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  useEffect(() => {
    applyFilter();
  }, []);

  // Apply filter and reset pagination
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setProducts([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const totalRecords = await getCount(params);

      paginationRef.current.totalRecords = totalRecords;
      const productsData = await getData(params);
      setProducts(productsData);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
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
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const productsData = await getData(params);
      setProducts((prev) => [...prev, ...productsData]);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleFilterChange = useCallback(({ formData }: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...formData,
    };
    applyFilter();
  }, []);

  const handleItemClick = useCallback(({ action, data }: any) => {
    if (action === "view") {
      appNav.to(`/dashboard/inventory/deal/${data._id}`);
    }
  }, []);

  return (
    <>
      <AppHeader title="Inventory Management" />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center">
            <AppBreadcrumbs data={breadcrumbs} />
          </div>
          <div className="tw:mb-6 tw:text-gray-500 tw:text-xs">
            Monitor stock levels, track movement patterns, and manage alerts
          </div>

          <InventoryTab activeTab="stock-alerts" className="tw:mb-4" />

          <StockAlertSummary />

          <AppCard
            title={`Stock Alert Details  (${paginationRef.current.totalRecords})`}
            icon="triangle-alert"
          >
            <Filter onFilterChange={handleFilterChange} className="tw:mb-4" />
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={products.length}
              fwSize="sm"
              className="tw:mb-4"
            />
            {isMobile ? (
              <MobileView data={products} callback={handleItemClick} />
            ) : (
              <Table
                data={products}
                loading={loading}
                callback={handleItemClick}
              />
            )}
            {hasMoreData && !loading && (
              <div className="tw:flex tw:justify-center tw:mt-6">
                <AppButton
                  fill="outline"
                  color="light"
                  size="small"
                  onClick={loadMore}
                  isLoading={loadingMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </AppButton>
              </div>
            )}
          </AppCard>
        </div>
      </div>
    </>
  );
};

export default StockAlerts;
