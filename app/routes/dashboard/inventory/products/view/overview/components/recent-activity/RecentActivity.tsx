import { useCallback, useEffect, useRef, useState } from "react";
import { getData, getCount, prepareParams } from "./helper";
import type { PaginationState } from "~/types/CommonTypes";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import AppButton from "~/components/core/button/AppButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { useTranslation } from "react-i18next";

const defaultFilter = {
  search: "",
  dateRange: null,
  status: "",
};

const RecentActivity = ({ dealId }: { dealId: string }) => {
  const { t } = useTranslation(["common"]);
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
      const totalRecords = await getCount(dealId);
      paginationRef.current.totalRecords = totalRecords;
      const resultData = await getData(dealId);
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
      const resultData = await getData(dealId);
      setData((prev) => [...prev, ...resultData]);
      setHasMoreData(resultData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  return (
    <AppCard title={t("recentActivity")} className="tw:mb-4" icon="activity">
      <AppScrollArea className="tw:max-h-96">
        {loading ? (
          <div className="tw:p-4 tw:text-center tw:text-gray-400">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="tw:p-4 tw:text-center tw:text-gray-400">
            No activity found.
          </div>
        ) : (
          <div className="tw:divide-y tw:divide-gray-100 tw:max-h-96">
            {data.map((item: any) => (
              <div
                key={item._id}
                className="tw:py-3 tw:border-b tw:border-gray-100"
              >
                <div className="tw:flex tw:justify-between tw:items-center">
                  {/* Main message */}
                  <div className="tw:font-medium tw:text-gray-900 tw:text-xs">
                    {item.remarks || "-"}
                  </div>
                  {/* Amount */}
                  {/* <div
                  className={
                    `tw:font-bold tw:text-sm ` +
                    (item.direction === "IN"
                      ? "tw:text-green-600"
                      : "tw:text-red-600")
                  }
                >
                  {item.direction === "IN" ? "+" : ""}
                  <DisplayQty
                    qty={
                      item?.activityDetails?.stockOperation?.quantityChange || 0
                    }
                    isLooseQty={item.isLooseDeal || false}
                  />{" "}
                  {item._quantityUom}
                </div> */}
                </div>
                <div className="tw:flex tw:justify-between tw:items-center tw:mt-1">
                  {/* Date */}
                  <div className="tw:text-xs tw:text-gray-400">
                    <DateFormat value={item.loggedAt} />
                    {item.userName ? (
                      <span className="tw:ml-2">by {item.userName}</span>
                    ) : null}
                  </div>

                  {/* Balance */}
                  {/* <div className="tw:text-xs tw:text-gray-400">
                  Bal:{" "}
                  <DisplayQty
                    qty={
                      item?.activityDetails?.stockOperation?.newQuantity || 0
                    }
                    isLooseQty={item.isLooseDeal || false}
                  />
                </div> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </AppScrollArea>
      {hasMoreData && !loading && (
        <div className="tw:flex tw:justify-center tw:mt-4">
          <AppButton
            onClick={loadMore}
            disabled={loadingMore}
            fill="outline"
            size="small"
            color="dark"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </AppButton>
        </div>
      )}
    </AppCard>
  );
};

export default RecentActivity;
