import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import type { PaginationState } from "~/types/CommonTypes";
import {
  formatDueLabel,
  getNudgeTargets,
  nudgeStatusTone,
  prepareNudgeParams,
  type PaylaterNudgeTarget,
} from "./helper";

/** Avatar tints, cycled so adjacent rows stay distinguishable. */
const AVATAR_TONES = [
  "tw:bg-rose-800",
  "tw:bg-fuchsia-600",
  "tw:bg-amber-600",
  "tw:bg-sky-600",
];

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface PaylaterNudgeTargetsProps {
  /** Section title above the list. */
  title?: string;
  /** Rows fetched per page. Defaults to 10. */
  pageSize?: number;
  /** Drop wallets that are still ahead of their due date. */
  overdueOnly?: boolean;
  /** Tapping a row hands back the wallet it belongs to. */
  onSelect?: (target: PaylaterNudgeTarget) => void;
  className?: string;
}

/**
 * "Top nudge targets" for the PayLater pane — every wallet queued for a chase,
 * worst first, with how many there are in total. Reads `type=nudge_targets` off
 * the insights dashboard and pages in place, the same way the Prices pane's
 * alert feed does: one count call for the header, then a page at a time.
 */
const PaylaterNudgeTargets = ({
  title = "Top nudge targets",
  pageSize = 10,
  overdueOnly = false,
  onSelect,
  className,
}: PaylaterNudgeTargetsProps) => {
  const [targets, setTargets] = useState<PaylaterNudgeTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: pageSize,
    startSlNo: 1,
    endSlNo: pageSize,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    paginationRef.current = {
      ...paginationRef.current,
      rowsPerPage: pageSize,
      activePage: 1,
      startSlNo: 1,
      endSlNo: pageSize,
    };

    try {
      const params = prepareNudgeParams(paginationRef.current, overdueOnly);
      const { targets: result, total } = await getNudgeTargets(params);
      setTargets(result);

      paginationRef.current.totalRecords = total;
      setTotalRecords(total || result.length);
      setHasMoreData(result.length < (total || result.length));
    } catch (error) {
      console.error("Error fetching paylater nudge targets:", error);
      setTargets([]);
      setHasMoreData(false);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize, overdueOnly]);

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
      const params = prepareNudgeParams(paginationRef.current, overdueOnly);
      const { targets: result, total } = await getNudgeTargets(params);

      setTargets((prev) => [...prev, ...result]);

      const { activePage, rowsPerPage } = paginationRef.current;
      paginationRef.current.totalRecords = total;
      setTotalRecords(total);
      setHasMoreData(result.length > 0 && activePage * rowsPerPage < total);
    } catch (error) {
      console.error("Error loading more paylater nudge targets:", error);
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore, overdueOnly]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-2", className)}>
      {/* Header — the section label with how many wallets are queued. */}
      <p className="app-pane-label">
        {title}
        {totalRecords ? ` · ${totalRecords}` : ""}
      </p>

      {/* Radix lays the viewport's content out as a `display:table` box, which
          sizes to its widest row and lets long names push past the pane —
          `no-table` puts it back to a block so `truncate` can do its job. */}
      <AppScrollArea className="no-table tw:h-80 tw:w-full tw:pr-1">
        {loading ? (
          <div className="tw:flex tw:flex-col tw:gap-2">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="tw:h-13 tw:animate-pulse tw:rounded-xl tw:bg-slate-100"
              />
            ))}
          </div>
        ) : !targets.length ? (
          <p className="tw:rounded-xl tw:bg-slate-50 tw:px-2.5 tw:py-3 tw:text-center tw:text-[11px] tw:text-slate-400">
            Nobody needs a nudge right now
          </p>
        ) : (
          <div className="tw:flex tw:flex-col tw:divide-y tw:divide-slate-100">
            {targets.map((target, index) => {
              const isOverdue = target.overdueDays > 0;
              const hasLimit = target.creditLimit > 0;

              return (
                <button
                  key={`${target.userId}-${index}`}
                  type="button"
                  disabled={!onSelect}
                  onClick={() => onSelect?.(target)}
                  className={clsx(
                    "tw:flex tw:w-full tw:items-center tw:gap-2.5 tw:px-1 tw:py-2.5 tw:text-left",
                    onSelect && "tw:rounded-xl tw:hover:bg-slate-50",
                  )}
                >
                  <div
                    className={clsx(
                      "tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white",
                      AVATAR_TONES[index % AVATAR_TONES.length],
                    )}
                  >
                    {initialsOf(target.userName)}
                  </div>

                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:flex tw:items-center tw:gap-1.5">
                      <p className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                        {target.userName}
                      </p>
                      {target.status && (
                        <span
                          className={clsx(
                            "tw:shrink-0 tw:rounded-full tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wide",
                            nudgeStatusTone(target.status, target.overdueDays),
                          )}
                        >
                          {target.status}
                        </span>
                      )}
                    </div>
                    <p
                      className={clsx(
                        "tw:mt-0.5 tw:truncate tw:text-[11px] tw:font-medium",
                        isOverdue ? "tw:text-rose-500" : "tw:text-slate-400",
                      )}
                    >
                      {formatDueLabel(target.overdueDays)}
                      {target.userType ? ` · ${target.userType}` : ""}
                    </p>
                  </div>

                  <div className="tw:shrink-0 tw:text-right">
                    <p
                      className={clsx(
                        "tw:text-sm tw:font-bold tw:tabular-nums",
                        isOverdue ? "tw:text-rose-500" : "tw:text-slate-800",
                      )}
                    >
                      <Amount value={target.outstanding} decimalPlaces={0} />
                    </p>
                    {hasLimit && (
                      /* Wallet load behind the chase — the sanctioned limit and
                         how much of it is in use, weighed at a glance. */
                      <p className="tw:mt-0.5 tw:text-[10px] tw:font-medium tw:tabular-nums tw:text-slate-400">
                        {"of "}
                        <Amount value={target.creditLimit} decimalPlaces={0} />
                        {` · ${target.utilizationPercent}%`}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {hasMoreData && !loading && targets.length > 0 && (
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalRecords}
            loadedCount={targets.length}
            loaderType="button"
          />
        )}
      </AppScrollArea>
    </div>
  );
};

export default PaylaterNudgeTargets;
