import { useRef, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { PaginationState } from "~/types/CommonTypes";
import { prepareParams, getData, getCount } from "./helper";

import Filter from "./Filter";
import Item from "./Item";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

const ActivityLog = ({ binId }: { binId: string }) => {
  const appNav = useAppNav();
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
      const result = await getData(params, filterRef.current.binId);
      setData(result || []);
      const totalRecords = await getCount(params, filterRef.current.binId);
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
      const result = await getData(params, filterRef.current.binId);
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
      binId: binId,
    };
    applyFilter();
  }, [binId]);

  const onFilterChange = useCallback((data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  }, []);

  const onItemCallback = useCallback((a: { action: string; data: any }) => {
    if (a.action === "view-bin") {
      appNav.to(`/dashboard/inventory/rack-bin/bin/view/${a.data.binId}`);
    }
  }, []);

  return (
    <AppCard title={t("activityLog")} className="tw:mb-4">
      <Filter callback={onFilterChange} />

      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={loading}
        loadedCount={data.length}
        fwSize="sm"
        className="tw:mb-4"
      />

      <div>
        {loading ? (
          <div className="tw-text-center tw-py-8">{t("loading")}</div>
        ) : data.length === 0 ? (
          <div className="tw-text-center tw-py-8">{t("noActivityFound")}</div>
        ) : (
          data.map((item, idx) => (
            <Item key={idx} data={item} callback={onItemCallback} />
          ))
        )}
      </div>
      {hasMoreData && !loading && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
          />
        </div>
      )}
    </AppCard>
  );
};

export default ActivityLog;
