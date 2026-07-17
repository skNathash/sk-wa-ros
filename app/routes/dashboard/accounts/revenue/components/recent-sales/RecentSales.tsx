import { IndianRupee } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import useScreenView from "~/hooks/useScreenView";
import { useTranslation } from "react-i18next";
import type { PaginationState } from "~/types/CommonTypes";
import DesktopView from "./DesktopView";
import { getCount, getData, prepareParams } from "./helper";
import MobileView from "./MobileView";

const RecentSales = () => {
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
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
    applyFilter();
  }, []);

  return (
    <AppCard title={t("recent30Transaction")} icon={<IndianRupee />}>
      <AppScrollArea className="tw:md:h-[calc(100vh-300px)]">
        {isMobile ? (
          <MobileView loading={loading} data={data} />
        ) : (
          <DesktopView loading={loading} data={data} />
        )}
        {hasMoreData && !loading && (
          <div className="tw:text-center tw:mt-4 tw:mb-2">
            <LoadMoreButton
              loadMore={loadMore}
              loading={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
            />
          </div>
        )}
      </AppScrollArea>
    </AppCard>
  );
};

export default RecentSales;
