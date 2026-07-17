import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Filter from "./components/Filter";
import { defaultFilter, getCount, getData, prepareParams } from "./helper";

const PurchaseHistory = () => {
  const { isMobile } = useScreenView();
  const appNav = useAppNav();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<any>({
    ...defaultFilter,
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
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update filterRef with customer ID and load data when id changes
  useEffect(() => {
    if (id) {
      filterRef.current = {
        ...filterRef.current,
        customerId: id,
      };
      applyFilter();
    }
  }, [id, applyFilter]);

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
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleFilter = useCallback(
    ({ formData }: { formData: any }) => {
      filterRef.current = {
        ...filterRef.current,
        ...formData,
      };
      applyFilter();
    },
    [applyFilter]
  );

  // Callback for item actions (view, download, etc)
  const handleItemCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "view-order") {
      appNav.to(`/dashboard/orders/view/${data.orderId}`);
    }
  };

  const handleSort = useCallback(
    ({ key, value }: { key: string; value: SortValue }) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter]
  );

  return (
    <>
      <AppCard
        title="Purchase History"
        subtitle="All orders placed by this customer"
      >
        <Filter callback={handleFilter} />

        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={loading}
          loadedCount={data.length}
          fwSize="sm"
          className="tw:mb-4"
        />
        {isMobile ? (
          <MobileView
            data={data}
            loading={loading}
            callback={handleItemCallback}
          />
        ) : (
          <DesktopView
            data={data}
            loading={loading}
            callback={handleItemCallback}
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
            onSort={handleSort}
          />
        )}

        {hasMoreData && !loading && (
          <div className="tw:text-center tw:mt-4">
            <AppButton
              onClick={loadMore}
              disabled={loadingMore}
              size="small"
              color="light"
              fill="outline"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </AppButton>
          </div>
        )}
      </AppCard>
    </>
  );
};

export default PurchaseHistory;
