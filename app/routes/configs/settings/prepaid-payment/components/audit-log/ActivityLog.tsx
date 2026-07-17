import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { getData, getCount, prepareParams } from "./helper";
import Filter from "./Filter";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";

type PerformedBy = {
  name?: string;
  userType?: string;
};

type LogEntry = {
  action: string;
  businessType?: string;
  createdAt: string;
  message?: string;
  performedBy?: PerformedBy;
  changes?: any[];
};

const ActivityLog: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef({
    dateRange: [],
  });

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setLogs([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const data = await getData(params);
      setLogs(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const data = await getData(params);
      setLogs((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, searchParams]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const handleFilterChange = (data: { formData: any }) => {
    filterRef.current = data.formData;
    applyFilter();
  };

  return (
    <>
      <Filter callback={handleFilterChange} />

      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:py-8 tw:min-h-72">
          <AppSpinner />
        </div>
      ) : null}

      {!loading && logs.length === 0 ? <NoData /> : null}

      <div className="tw:bg-white tw:rounded tw:border tw:border-gray-100 tw:divide-y tw:divide-gray-100">
        {logs.map((l, i) => (
          <div
            key={(l.createdAt || "") + i}
            className="tw:p-2.5 tw:hover:bg-gray-50 tw:transition-colors"
          >
            <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:flex tw:items-center tw:gap-1 tw:flex-wrap">
                  <span className="tw:font-medium tw:text-xs tw:text-gray-900">
                    {l.action}
                  </span>
                  {l.businessType ? (
                    <span className="tw:text-xs tw:text-gray-500 tw:bg-gray-50 tw:px-1.5 tw:py-0.5 tw:rounded">
                      {l.businessType}
                    </span>
                  ) : null}
                </div>
                {l.message ? (
                  <div className="tw:text-xs tw:text-gray-700 tw:mt-1 tw:line-clamp-2">
                    {l.message}
                  </div>
                ) : null}
                <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1.5 tw:text-xs">
                  <span className="tw:inline-flex tw:items-center tw:gap-1 tw:px-2 tw:py-1 tw:bg-blue-50 tw:text-blue-700 tw:rounded tw:font-semibold tw:border tw:border-blue-200">
                    <span>👤</span>
                    {l.performedBy?.name || "Unknown"}
                  </span>
                  {l.performedBy?.userType ? (
                    <span className="tw:text-gray-500 tw:bg-gray-50 tw:px-1.5 tw:py-0.5 tw:rounded">
                      {l.performedBy.userType}
                    </span>
                  ) : null}
                </div>
                {Array.isArray(l.changes) && l.changes.length > 0 ? (
                  <div className="tw:text-xs tw:text-gray-500 tw:italic tw:mt-1">
                    {l.changes.length} change{l.changes.length > 1 ? "s" : ""}
                  </div>
                ) : null}
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:whitespace-nowrap">
                <DateFormat value={l.createdAt} />
              </div>
            </div>
          </div>
        ))}

        <LoadMoreButton
          loading={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={logs.length}
        />
      </div>
    </>
  );
};

export default ActivityLog;
