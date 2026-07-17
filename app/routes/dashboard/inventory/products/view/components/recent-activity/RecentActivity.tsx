import { useCallback, useEffect, useRef, useState } from "react";
import { getData, getCount, prepareParams } from "./helper";
import type { PaginationState } from "~/types/CommonTypes";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const defaultFilter = {
  search: "",
  dateRange: null,
  status: "",
};

const RecentActivity = ({ dealId }: { dealId: string }) => {
  const [data, setData] = useState<any[]>([]);
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
    filterRef.current = {
      ...filterRef.current,
      dealId,
    };
    applyFilter();
  }, [dealId]);

  // Apply filter and reset pagination
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setData([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const resultData = await getData(params);
      setData(resultData);
      setHasMoreData(resultData.length >= paginationRef.current.rowsPerPage);
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
      const resultData = await getData(params);
      setData((prev) => [...prev, ...resultData]);
      setHasMoreData(resultData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  return (
    <AppCard title="Recent Activity" className="tw:mb-4" icon="activity">
      {loading ? (
        <div className="tw:p-4 tw:text-center tw:text-gray-400">Loading...</div>
      ) : data.length === 0 ? (
        <div className="tw:p-4 tw:text-center tw:text-gray-400">
          No activity found.
        </div>
      ) : (
        <div className="tw:divide-y tw:divide-gray-100">
          {data.map((item: any) => (
            <div
              key={item._id}
              className="tw:py-3 tw:border-b tw:border-gray-100"
            >
              <div className="tw:flex tw:justify-between tw:items-center">
                {/* Main message */}
                <div className="tw:font-medium tw:text-gray-900 tw:text-sm">
                  {item._msg || "-"}
                </div>
                {/* Amount */}
                <div
                  className={
                    `tw:font-bold tw:text-sm ` +
                    (item.direction === "IN"
                      ? "tw:text-green-600"
                      : "tw:text-red-600")
                  }
                >
                  {item.direction === "IN" ? "+" : ""}
                  <DisplayQty
                    qty={item._quantity || 0}
                    isLooseQty={item.isLooseDeal || false}
                  />{" "}
                  {item._quantityUom}
                </div>
              </div>
              <div className="tw:flex tw:justify-between tw:items-center tw:mt-1">
                {/* Date */}
                <div className="tw:text-xs tw:text-gray-400">
                  <DateFormat value={item.createdAt} />
                </div>

                {/* Balance */}
                <div className="tw:text-xs tw:text-gray-400">
                  Bal:{" "}
                  <DisplayQty
                    qty={item._effectiveNewQty || 0}
                    isLooseQty={item.isLooseDeal || false}
                  />{" "}
                  {item._effectiveNewQtyUom}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {hasMoreData && !loading && (
        <div className="tw:flex tw:justify-center tw:mt-4">
          <button
            className="tw:px-4 tw:py-2 tw:border tw:rounded tw:bg-white tw:text-blue-600 hover:tw:bg-blue-50 tw:transition"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </AppCard>
  );
};

export default RecentActivity;
