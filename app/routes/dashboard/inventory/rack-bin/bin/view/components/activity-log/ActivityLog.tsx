import { useRef, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { PaginationState } from "~/types/CommonTypes";
import type { ActivityGroup } from "./helper";
import {
  prepareParams,
  getData,
  getCount,
  groupLabel,
  countLogs,
} from "./helper";

import Filter from "./Filter";
import Item from "./Item";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

const ActivityLog = ({ binId }: { binId: string }) => {
  const appNav = useAppNav();
  const { t } = useTranslation(["common"]);

  // The API already buckets the logs by day, so the timeline holds the groups
  // it was given.
  const [groups, setGroups] = useState<ActivityGroup[]>([]);
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
    setGroups([]);
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
      const page = await getData(params, filterRef.current.binId);
      setGroups(page);
      const totalRecords = await getCount(params, filterRef.current.binId);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(countLogs(page) >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setGroups([]);
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
      const page = await getData(params, filterRef.current.binId);
      setGroups((prev) => [...prev, ...(page || [])]);
      setHasMoreData(countLogs(page) >= paginationRef.current.rowsPerPage);
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
    if (a.action === "view-deal") {
      appNav.to(`/dashboard/inventory/products/view/${a.data.dealId}`);
    }
  }, []);

  const loadedCount = countLogs(groups);

  return (
    <div className="tw:mb-4">
      <Filter callback={onFilterChange} />

      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={loading}
        loadedCount={loadedCount}
        fwSize="sm"
        className="tw:mb-4"
      />

      {loading ? (
        <div className="tw:flex tw:flex-col tw:gap-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="tw:h-20 tw:animate-pulse tw:rounded-2xl tw:bg-white"
            />
          ))}
        </div>
      ) : !groups.length ? (
        <NoData description={t("noActivityFound")} />
      ) : (
        <div className="tw:flex tw:flex-col tw:gap-5">
          {groups.map((group, groupIdx) => (
            <section key={group.date || groupIdx}>
              <p className="app-label tw:mb-2 tw:border-b tw:border-slate-200 tw:pb-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-slate-400">
                {groupLabel(group.date)}
              </p>
              <div className="tw:flex tw:flex-col tw:gap-2">
                {(group.logs || []).map((log: any, idx: number) => (
                  <Item
                    key={log?.id || log?._id || idx}
                    data={log}
                    callback={onItemCallback}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {hasMoreData && !loading && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
