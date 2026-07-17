import { useCallback, useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState } from "~/types/CommonTypes";
import DesktopView from "./DesktopView";
import Filter from "./Filter";
import { getCount, getData, prepareParams } from "./helper";
import MobileView from "./MobileView";

interface FilterState {
  search?: string;
  dateRange?: Date[] | null;
  status?: string;
  feature?: string;
  vendorId?: string;
}

const defaultFilter: FilterState = {
  search: "",
  dateRange: null,
  status: "",
  feature: "purchase",
  vendorId: "",
};

const VendorPayment = ({ vendorId }: { vendorId: string }) => {
  const { isMobile } = useScreenView();
  const appNav = useAppNav();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [totalValue, setTotalValue] = useState(0);

  const filterRef = useRef<FilterState>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const sortRef = useRef<{ key: string; value: "asc" | "desc" }>({
    key: "paymentDate",
    value: "desc",
  });

  // Apply filter and reset pagination
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setOrders([]);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const { count: totalRecords, value: totalValue } = await getCount(
        vendorId,
        params
      );
      paginationRef.current.totalRecords = totalRecords;
      setTotalValue(totalValue);
      const ordersData = await getData(vendorId, params);
      setOrders(ordersData);
      setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more data for infinite scroll
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
        const ordersData = await getData(vendorId, params);
        setOrders((prev) => [...prev, ...ordersData]);
        setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);
      } finally {
        setLoadingMore(false);
        if (event?.target) event.target.complete();
      }
    },
    [loadingMore, hasMoreData]
  );

  useEffect(() => {
    filterRef.current = { ...defaultFilter, vendorId };
    applyFilter();
  }, [applyFilter, vendorId]);

  const sortCb = (data: { key: string; value: "asc" | "desc" }) => {
    sortRef.current = data;
    applyFilter();
  };

  const filterCb = (data: { formData: any; action: string }) => {
    if (data.action === "apply") {
      filterRef.current = { ...filterRef.current, ...data.formData };
    }
    applyFilter();
  };

  const callback = (a: { action: string; data: any }) => {
    if (a.action === "view") {
      appNav.to(`/dashboard/purchase-order/view/${a.data.poId}`);
    }
  };

  return (
    <div>
      <AppCard
        title={`Payment & Transactions (${paginationRef.current.totalRecords})`}
      >
        <Filter callback={filterCb} />
        <AppBadge variant="primary" className="tw:mb-4">
          Total Value: <Amount value={totalValue} decimalPlaces={2} />
        </AppBadge>
        {isMobile ? (
          <MobileView data={orders} callback={callback} />
        ) : (
          <>
            <DesktopView
              data={orders}
              callback={callback}
              sortKey={sortRef.current.key}
              sortValue={sortRef.current.value}
              sortCb={sortCb}
              loading={loading}
            />
            {!loading && hasMoreData && (
              <div className="tw:flex tw:justify-center tw:mt-4">
                <AppButton
                  size="small"
                  color="light"
                  fill="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </AppButton>
              </div>
            )}
          </>
        )}
      </AppCard>
    </div>
  );
};

export default VendorPayment;
