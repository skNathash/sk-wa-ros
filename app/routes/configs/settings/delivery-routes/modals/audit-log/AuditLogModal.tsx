import React, { useCallback, useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, User } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import DateFormat from "~/components/core/date/DateFormat";
import AppButton from "~/components/core/button/AppButton";
import { produce } from "immer";
import { getData, getCount, prepareParams } from "./helper";
import type { PaginationState } from "~/types/CommonTypes";

type AuditLog = {
  _id?: string;
  action?: string;
  routeId?: string;
  routeCode?: string;
  remarks?: string;
  createdAt?: string;
  performedBy?: {
    id: string;
    name: string;
    userType: string;
  };
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
    _id?: string;
  }[];
  showChanges?: boolean;
};

const AuditLogModal = ({
  show,
  callback,
  routeId,
}: {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  routeId: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);

  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    if (!routeId) return;

    // reset pagination to first page
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setLogs([]);

    try {
      const params = prepareParams({}, paginationRef);
      const totalRecords = await getCount(routeId, params);
      paginationRef.current.totalRecords = totalRecords;

      const data: AuditLog[] = await getData(routeId, params);
      setLogs(data || []);
      setHasMoreData((data || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    if (show) {
      void applyFilter();
    }
  }, [show, applyFilter]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams({}, paginationRef);
      const data: AuditLog[] = await getData(routeId, params);
      setLogs((prev) => [...prev, ...(data || [])]);
      setHasMoreData((data || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, routeId]);

  const handleClose = useCallback(() => {
    callback({ action: "close" });
  }, [callback]);

  const toggleChanges = (index: number) => {
    setLogs(
      produce((draft) => {
        draft[index].showChanges = !draft[index].showChanges;
      }),
    );
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return "None";
    if (typeof val === "boolean") return val ? "True" : "False";
    if (typeof val === "object") {
      if (Array.isArray(val)) {
        return val.join(", ") || "Empty List";
      }
      return val.name || val.routeCode || JSON.stringify(val);
    }
    return String(val);
  };

  return (
    <AppModal show={show} callback={callback} className="tw:md:h-[95vh]">
      <AppModal.Title onClose={handleClose}>Audit History</AppModal.Title>
      <AppModal.Content className="tw:max-h-[95vh]">
        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={loading}
          loadedCount={logs.length}
          fwSize="sm"
          className="tw:mb-4"
        />

        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && logs.length === 0 ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
            <NoData />
          </div>
        ) : null}

        {!loading && logs.length > 0 ? (
          <div className="tw:space-y-3">
            {logs.map((l, index) => (
              <div
                key={l._id || l.createdAt || index}
                className="tw:border tw:border-gray-200 tw:rounded-md tw:bg-white tw:p-3"
              >
                <div className="tw:mb-2">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1.5">
                    <span
                      className={`tw:text-[10px] tw:font-bold tw:px-2 tw:py-0.5 tw:rounded-full tw:uppercase tw:tracking-wider ${
                        l.action === "CREATED"
                          ? "tw:bg-green-100 tw:text-green-700"
                          : l.action === "DEACTIVATED"
                            ? "tw:bg-red-100 tw:text-red-700"
                            : l.action === "LINKED"
                              ? "tw:bg-blue-100 tw:text-blue-700"
                              : "tw:bg-gray-100 tw:text-gray-700"
                      }`}
                    >
                      {l.action}
                    </span>
                    <span className="tw:text-[11px] tw:font-medium tw:text-gray-400">
                      {l.routeCode} • {l.routeId}
                    </span>
                  </div>
                  <div className="tw:text-sm tw:font-medium tw:text-gray-800 tw:leading-relaxed">
                    {l.remarks || "-"}
                  </div>
                </div>

                <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mt-4 tw:pt-3 tw:border-t tw:border-gray-50">
                  <div className="tw:text-[11px] tw:text-gray-500 tw:flex tw:flex-wrap tw:items-center tw:gap-y-1 tw:gap-x-4">
                    <span className="tw:flex tw:items-center tw:gap-1.5">
                      <User size={13} className="tw:text-gray-400" />
                      <span className="tw:text-gray-700 tw:font-medium">
                        {l.performedBy?.name || "--"}
                      </span>
                      <span className="tw:text-gray-400 tw:text-[9px] tw:bg-gray-50 tw:px-1 tw:rounded">
                        {l.performedBy?.userType}
                      </span>
                    </span>
                    <span className="tw:flex tw:items-center tw:gap-1.5">
                      <Calendar size={13} className="tw:text-gray-400" />
                      {l.createdAt ? (
                        <DateFormat
                          value={l.createdAt}
                          formatStr="dd MMM yyyy hh:mm a"
                        />
                      ) : (
                        "-"
                      )}
                    </span>
                  </div>
                  <div className="tw:shrink-0">
                    <AppButton
                      size="small"
                      fill="clear"
                      className="tw:h-7 tw:px-2 tw:text-primary tw:hover:bg-primary/5"
                      onClick={() => toggleChanges(index)}
                    >
                      <span className="tw:text-xs">
                        {l.showChanges ? "Hide details" : "View changes"}
                      </span>
                      {l.showChanges ? (
                        <ChevronUp size={14} className="tw:ml-1" />
                      ) : (
                        <ChevronDown size={14} className="tw:ml-1" />
                      )}
                    </AppButton>
                  </div>
                </div>

                {l.showChanges && (
                  <div className="tw:mt-4 tw:pt-3 tw:border-t tw:border-gray-100">
                    {l.changes && l.changes.length > 0 ? (
                      <div className="tw:space-y-3">
                        {l.changes.map((c, ci) => (
                          <div
                            key={ci}
                            className="tw:bg-gray-50 tw:rounded-lg tw:p-2.5"
                          >
                            <div className="tw:text-[10px] tw:font-bold tw:text-gray-500 tw:uppercase tw:mb-1.5 tw:tracking-wider">
                              Field: {c.field}
                            </div>
                            <div className="tw:grid tw:grid-cols-1 md:tw:grid-cols-2 tw:gap-4">
                              <div className="tw:space-y-1">
                                <div className="tw:text-[10px] tw:text-gray-400">
                                  Old Value
                                </div>
                                <div className="tw:text-xs tw:text-gray-600 tw:bg-white tw:p-2 tw:rounded tw:border tw:border-gray-100 tw:min-h-[32px] tw:flex tw:items-center">
                                  {formatValue(c.oldValue)}
                                </div>
                              </div>
                              <div className="tw:space-y-1">
                                <div className="tw:text-[10px] tw:text-gray-400">
                                  New Value
                                </div>
                                <div className="tw:text-xs tw:text-gray-900 tw:font-medium tw:bg-white tw:p-2 tw:rounded tw:border tw:border-gray-100 tw:min-h-[32px] tw:flex tw:items-center">
                                  {formatValue(c.newValue)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="tw:text-xs tw:text-gray-500 tw:italic tw:text-center tw:py-2">
                        No field-level changes recorded
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {hasMoreData && !loadingMore && (
              <div className="tw:text-center">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={logs.length}
                />
              </div>
            )}
          </div>
        ) : null}
      </AppModal.Content>
    </AppModal>
  );
};

export default AuditLogModal;
