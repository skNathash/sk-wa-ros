import React, { useCallback, useEffect, useState } from "react";
import DateFormat from "~/components/core/date/DateFormat";
import {
  defaultFilter,
  defaultSummary,
  getData as getFollowUps,
  getSummary,
  prepareParams as prepareFollowUpParams,
  type RetailerSummary,
} from "../follow-ups/helper";

interface FollowUpHistoryProps {
  fid: string;
  // Bumping this re-fetches after a mutation upstream.
  reloadKey?: number;
  // Open a single follow-up's remarks history (the follow-up detail component).
  onView: (followup: any) => void;
  className?: string;
}

// Compact preview count, expanded to the full list via "View all".
const PREVIEW_COUNT = 3;
const MAX_COUNT = 100;

// A small status dot + label, coloured to match the follow-up status.
const StatusPill = ({ row }: { row: any }) => {
  const overdue = row._isFolloupDue;
  const closed = row.status === "Completed";
  const cls = overdue
    ? "tw:text-red-600"
    : closed
      ? "tw:text-green-600"
      : "tw:text-amber-600";
  const dot = overdue
    ? "tw:bg-red-500"
    : closed
      ? "tw:bg-green-500"
      : "tw:bg-amber-500";
  const label = overdue ? "Overdue" : row._statusLabel || row.status || "—";
  return (
    <span className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium ${cls}`}>
      <span className={`tw:h-1.5 tw:w-1.5 tw:rounded-full ${dot}`} />
      {label}
    </span>
  );
};

// Right-column "Follow-up history" card: open/closed/overdue counts over a
// compact list of the retailer's follow-ups. Reuses the follow-ups helper as the
// data source ("use the followup component" for the history). Rows open the
// follow-up detail modal for the full remarks timeline.
const FollowUpHistory: React.FC<FollowUpHistoryProps> = ({
  fid,
  reloadKey = 0,
  onView,
  className,
}) => {
  const [summary, setSummary] = useState<RetailerSummary>(defaultSummary);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!fid) return;
    setLoading(true);
    try {
      const params = prepareFollowUpParams(
        fid,
        defaultFilter,
        {
          activePage: 1,
          rowsPerPage: expanded ? MAX_COUNT : PREVIEW_COUNT,
          startSlNo: 1,
          endSlNo: expanded ? MAX_COUNT : PREVIEW_COUNT,
          totalRecords: 0,
        },
        { key: "createdAt", value: "desc" },
      );
      const [list, sum] = await Promise.all([
        getFollowUps(params),
        getSummary(fid, defaultFilter),
      ]);
      setRows(list || []);
      setSummary(sum);
    } catch (e) {
      setRows([]);
      setSummary(defaultSummary);
    } finally {
      setLoading(false);
    }
  }, [fid, expanded, reloadKey]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div
      className={`tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-3 ${className || ""}`}
    >
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
          Follow-up history
        </span>
        <span className="tw:text-xs tw:text-gray-500">
          {summary.total} total
        </span>
      </div>

      {/* Status pills. */}
      <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-1 tw:text-xs">
        <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:font-medium tw:text-amber-600">
          <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-amber-500" />
          {summary.open + summary.inProgress} open
        </span>
        <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:font-medium tw:text-green-600">
          <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-green-500" />
          {summary.closed} closed
        </span>
        <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:font-medium tw:text-red-600">
          <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-red-500" />
          {summary.overdue} overdue
        </span>
      </div>

      {/* Compact rows. */}
      <div
        className={`tw:mt-3 tw:flex tw:flex-col tw:divide-y tw:divide-gray-100 ${
          expanded ? "tw:max-h-72 tw:overflow-y-auto" : ""
        }`}
      >
        {loading && rows.length === 0 ? (
          Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
            <div key={i} className="tw:h-9 tw:animate-pulse tw:bg-gray-50" />
          ))
        ) : rows.length === 0 ? (
          <div className="tw:py-4 tw:text-center tw:text-xs tw:text-gray-500">
            No follow-ups yet.
          </div>
        ) : (
          rows.map((row, idx) => (
            <button
              key={row._id || idx}
              type="button"
              onClick={() => onView(row)}
              className="tw:grid tw:grid-cols-[1fr_auto] tw:items-center tw:gap-3 tw:rounded-md tw:px-1 tw:py-2 tw:text-left tw:transition-colors tw:hover:bg-gray-50 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-indigo-500/40"
            >
              {/* Who modified + status + remarks. */}
              <span className="tw:flex tw:min-w-0 tw:flex-col">
                <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
                  <span className="tw:line-clamp-2 tw:text-xs tw:font-medium tw:text-gray-800">
                    {row.modifiedBy?.name ||
                      row.employee?.name ||
                      row.assignedTo?.name ||
                      "—"}
                  </span>
                  <StatusPill row={row} />
                </span>
                {row.remarks && (
                  <span className="tw:mt-0.5 tw:line-clamp-2 tw:text-[11px] tw:text-gray-600">
                    {row.remarks}
                  </span>
                )}
              </span>
              {/* When modified. */}
              <span className="tw:whitespace-nowrap tw:text-[11px] tw:text-gray-500">
                <DateFormat
                  value={row.modifiedAt || row.updatedAt || row.createdAt}
                  formatStr="dd MMM, hh:mm a"
                />
              </span>
            </button>
          ))
        )}
      </div>

      {summary.total > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="tw:mt-2 tw:w-full tw:rounded-lg tw:border tw:border-gray-200 tw:py-1.5 tw:text-xs tw:font-medium tw:text-gray-600 tw:transition-colors tw:hover:bg-gray-50 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-indigo-500/40"
        >
          {expanded ? "Show less" : `View all ${summary.total}`}
        </button>
      )}
    </div>
  );
};

export default FollowUpHistory;
