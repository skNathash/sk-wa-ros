import { useCallback, useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useScreenView from "~/hooks/useScreenView";
import Filter from "~/shared/accounts/paylater/network-statement/components/Filter";
import OrderDetailModal from "~/shared/orders/modals/order-detail/OrderDetailModal";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams, type StatementFilter } from "./helper";

type Props = {
  /** Seller whose paylater wallet the transactions belong to. */
  sellerId: string;
  className?: string;
};

const ROWS = 10;

/**
 * PayLater statement for this seller — every debit against the wallet with the
 * balance left after it, the same feed the B2B network view shows the seller,
 * read from the buyer's side.
 */
const PaylaterStatement = ({ sellerId, className }: Props) => {
  const { isMobile } = useScreenView();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [orderId, setOrderId] = useState("");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: ROWS,
    startSlNo: 1,
    endSlNo: ROWS,
    totalRecords: 0,
  });

  const filterRef = useRef<StatementFilter>({ sellerId });

  const sortRef = useRef<SortProps>({ key: "createdAt", value: "desc" });

  const applyFilter = useCallback(async () => {
    if (!sellerId) return;

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
      const rows = await getData(params);
      setData(rows);
      paginationRef.current.totalRecords = await getCount(params);
      setHasMoreData(rows.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      paginationRef.current.totalRecords = 0;
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

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
      const rows = await getData(params);
      setData((prev) => [...prev, ...rows]);
      setHasMoreData(rows.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore]);

  useEffect(() => {
    filterRef.current = { sellerId };
    applyFilter();
  }, [applyFilter, sellerId]);

  const onFilterChange = useCallback(
    ({ formData }: { formData: any }) => {
      filterRef.current = { ...filterRef.current, ...formData };
      applyFilter();
    },
    [applyFilter],
  );

  const handleRowCallback = ({ action, data: row }: { action: string; data: any }) => {
    if (action === "view-order") {
      setOrderId(row?.orderDetails?.orderId || "");
    }
  };

  const viewProps = {
    data,
    loading,
    loadMore,
    loadingMore,
    totalCount: paginationRef.current.totalRecords,
    loadedCount: data.length,
    hasMoreData,
    callback: handleRowCallback,
  };

  return (
    <div className={className}>
      <div className="tw:mb-3 tw:text-base tw:font-bold tw:text-slate-900">
        PayLater statement
      </div>

      <Filter callback={onFilterChange} />

      <div className="tw:mb-3">
        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={loading}
          loadedCount={data.length}
          fwSize="sm"
        />
      </div>

      {isMobile ? (
        <MobileView {...viewProps} />
      ) : (
        <AppCard noPadding>
          <DesktopView {...viewProps} />
        </AppCard>
      )}

      <OrderDetailModal
        orderId={orderId}
        show={!!orderId}
        callback={({ action }: { action: string }) => {
          if (action === "close") setOrderId("");
        }}
      />
    </div>
  );
};

export default PaylaterStatement;
