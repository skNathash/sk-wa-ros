import { useCallback, useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import NoData from "~/components/core/no-data/NoData";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

const VendorPaymentSummary = ({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}) => {
  const { t } = useTranslation();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 50,
    startSlNo: 1,
    endSlNo: 50,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

  // Apply filter (initial load or filter change)
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
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
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

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
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

  // Initial load
  useEffect(() => {
    filterRef.current = {
      ...filterRef.current,
      fromDate,
      toDate,
    };
    applyFilter();
  }, [fromDate, toDate]);

  return (
    <>
      <AppCard title={t("paymentSummary")} icon="building-2">
        <AppScrollArea className="tw:h-[calc(100vh-10px)]">
          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
              <div className="tw:animate-spin tw:rounded-full tw:h-8 tw:w-8 tw:border-b-2 tw:border-gray-900"></div>
            </div>
          ) : data.length === 0 ? (
            <NoData />
          ) : (
            <>
              {data.map((item) => (
                <div
                  key={item._id}
                  className="tw:bg-gray-100 tw:p-4 tw:rounded-lg tw:flex tw:justify-between tw:items-center tw:mb-2 tw:gap-4"
                >
                  <div>
                    {item._id?.redirectionUrl &&
                    item._id.redirectionUrl !== "#" ? (
                      <AppLink
                        asLink
                        href={item._id.redirectionUrl}
                        className="tw:text-sm tw:font-medium tw:hover:tw:text-blue-600 tw:transition-colors"
                      >
                        {item._id.name}
                      </AppLink>
                    ) : (
                      <h3 className="tw:text-sm tw:font-medium">
                        {item._id.name}
                      </h3>
                    )}
                    <div className="tw:text-xs tw:text-gray-500">
                      {item._id.type}
                    </div>
                  </div>
                  <div className="tw:text-right">
                    <Amount
                      value={item.totalAmount}
                      decimalPlaces={2}
                      className="tw:text-lg tw:font-semibold tw:text-red-600"
                    />
                    <div className="tw:text-xs tw:text-gray-500">
                      {t("pending")}
                    </div>
                  </div>
                </div>
              ))}
              {hasMoreData && !loading && (
                <div className="tw:text-center tw:mt-4">
                  <LoadMoreButton
                    loadMore={loadMore}
                    loadedCount={data.length}
                    loading={loadingMore}
                    totalCount={paginationRef.current.totalRecords}
                  />
                </div>
              )}
            </>
          )}
        </AppScrollArea>
      </AppCard>
    </>
  );
};

export default VendorPaymentSummary;
