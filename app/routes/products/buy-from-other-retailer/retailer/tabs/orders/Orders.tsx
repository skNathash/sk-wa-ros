import { Download, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import OrderDetailModal from "~/shared/orders/modals/order-detail/OrderDetailModal";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import Filter from "./components/filter/Filter";
import DesktopView from "./components/list/DesktopView";
import MobileView from "./components/list/MobileView";
import OrderStatus, { ALL_STATUS } from "./components/order-status/OrderStatus";
import Summary from "./components/summary/Summary";
import {
  defaultFilter,
  emptySummary,
  getCount,
  getData,
  getSummary,
  prepareParams,
  type FilterFormData,
  type OrderSummary,
} from "./helper";

type Props = {
  retailerId: string;
  retailerName?: string;
};

const Orders = ({ retailerId, retailerName }: Props) => {
  const { isMobile } = useScreenView();
  const appNav = useAppNav();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [status, setStatus] = useState<string>(ALL_STATUS);
  const [paymentDue, setPaymentDue] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState<OrderSummary>(emptySummary);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // The order open in the detail pane — a drawer on desktop, a sheet on mobile.
  const [detailOrderId, setDetailOrderId] = useState<string>("");

  const formMethods = useForm<FilterFormData>({
    defaultValues: { ...defaultFilter, retailerId },
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const [sort, setSort] = useState<{ key: string; value: SortValue }>({
    key: "createdAt",
    value: "desc",
  });

  const sortRef = useRef<{ key: string; value: SortValue }>(sort);

  const filterRef = useRef<FilterFormData>({ ...defaultFilter, retailerId });

  const loadSummary = useCallback(async (params: Record<string, any>) => {
    setSummaryLoading(true);
    try {
      setSummary(await getSummary(filterRef.current.retailerId, params));
    } catch (e) {
      setSummary(emptySummary);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

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
        sortRef.current,
      );

      // Summary aggregates run off the same filter payload, minus paging.
      loadSummary(params);

      const result = await getData(params, filterRef.current.retailerId);

      setData(result || []);

      const countResult = await getCount(params, filterRef.current.retailerId);
      paginationRef.current.totalRecords = countResult.totalOrders;
      setTotalRecords(countResult.totalOrders);

      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [loadSummary]);

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
        sortRef.current,
      );
      const result = await getData(params, filterRef.current.retailerId);
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
    if (retailerId) {
      filterRef.current = { ...filterRef.current, retailerId };
      applyFilter();
    }
  }, [retailerId, applyFilter]);

  const handleFilterCallback = useCallback(
    ({ action, data: formData }: { action: string; data?: any }) => {
      if (action !== "apply") return;
      filterRef.current = { ...filterRef.current, ...formData, retailerId };
      applyFilter();
    },
    [applyFilter, retailerId],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatus(value);
      filterRef.current = { ...filterRef.current, status: value };
      applyFilter();
    },
    [applyFilter],
  );

  const handlePaymentDueChange = useCallback(
    (next: boolean) => {
      setPaymentDue(next);
      filterRef.current = { ...filterRef.current, paymentDue: next };
      applyFilter();
    },
    [applyFilter],
  );

  const handleSort = useCallback(
    (next: { key: string; value: SortValue }) => {
      sortRef.current = next;
      setSort(next);
      applyFilter();
    },
    [applyFilter],
  );

  const handleListCallback = useCallback(
    ({ action, data: row }: { action: string; data: any }) => {
      if (action !== "view-order") return;
      setDetailOrderId(row?.orderId || row?._id || "");
    },
    [],
  );

  // Ordering from this retailer means going back to their catalog.
  const handleNewOrder = () => {
    appNav.to(`/products/buy-from-other-retailer/retailer/${retailerId}`, {
      tab: "catalog",
    });
  };

  return (
    <div className="tw:space-y-4">
      <Summary summary={summary} loading={summaryLoading} />

      <div className="tw:flex tw:flex-col tw:gap-3 tw:lg:flex-row tw:lg:items-center">
        <OrderStatus
          value={status}
          onChange={handleStatusChange}
          counts={{ [ALL_STATUS]: totalRecords }}
          paymentDue={paymentDue}
          onPaymentDueChange={handlePaymentDueChange}
          paymentDueCount={summary.dueCount || undefined}
          className="tw:min-w-0 tw:flex-1"
        />

        {/* <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
          <AppButton color="light" fill="outline" size="small" disabled>
            <Download size={14} />
            Export
          </AppButton>
          <AppButton size="small" onClick={handleNewOrder}>
            <Plus size={14} />
            New order{retailerName ? ` to ${retailerName}` : ""}
          </AppButton>
        </div> */}
      </div>

      <FormProvider {...formMethods}>
        <Filter callback={handleFilterCallback} />
      </FormProvider>

      {isMobile ? (
        <>
          <MobileView
            data={data}
            loading={loading}
            callback={handleListCallback}
          />

          {hasMoreData && !loading && (
            <div className="tw:mt-4 tw:text-center">
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
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            loadMore={loadMore}
            loadingMore={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            hasMoreData={hasMoreData}
            sortKey={sort.key}
            sortValue={sort.value}
            onSort={handleSort}
            callback={handleListCallback}
            activeOrderId={detailOrderId}
          />
        </AppCard>
      )}

      <OrderDetailModal
        orderId={detailOrderId}
        show={!!detailOrderId}
        callback={({ action }) => {
          if (action === "close") setDetailOrderId("");
        }}
      />
    </div>
  );
};

export default Orders;
