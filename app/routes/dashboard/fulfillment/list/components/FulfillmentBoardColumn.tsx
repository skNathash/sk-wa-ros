import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  FULFILLMENT_STAGE_TONES,
  getStageProgress,
  type FulfillmentStage,
} from "~/shared/fulfillment/components/fulfillment-side-pane/helper";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, prepareFilters, type FulfillmentOrder } from "../helper";
import FulfillmentOrderCard from "./FulfillmentOrderCard";

interface FulfillmentBoardColumnProps {
  stage: FulfillmentStage;
  /** Search / type / route filters currently applied on the page. */
  filters: Record<string, any>;
  /**
   * Stage total resolved by the page for the same filters — the column reuses
   * it instead of asking the count API again for every board slide.
   */
  count?: number;
  countLoading?: boolean;
  className?: string;
}

const ROWS_PER_PAGE = 10;

/**
 * One board lane: the stage heading with its total, and the orders sitting in
 * that stage. Each lane owns its own paging, so loading more in one lane never
 * touches the others.
 */
const FulfillmentBoardColumn = ({
  stage,
  filters,
  count = 0,
  countLoading,
  className,
}: FulfillmentBoardColumnProps) => {
  const tone = FULFILLMENT_STAGE_TONES[stage.tone];
  const progress = getStageProgress(stage.key);

  const [data, setData] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: ROWS_PER_PAGE,
    endSlNo: ROWS_PER_PAGE,
    startSlNo: 1,
    totalRecords: 0,
  });

  const filterKey = JSON.stringify(filters);

  const fetchPage = useCallback(
    async (page: number) => {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: page,
        startSlNo: (page - 1) * ROWS_PER_PAGE + 1,
        endSlNo: page * ROWS_PER_PAGE,
      };

      const params = prepareFilters(
        { ...filters, status: stage.status },
        paginationRef.current,
        stage.key,
      );
      return getData(params, stage.key);
    },
    [filterKey, stage.key],
  );

  // Reload the lane whenever the page filters change.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchPage(1);
        if (cancelled) return;
        setData(response);
        setHasMoreData(response.length === ROWS_PER_PAGE);
      } catch (error) {
        if (cancelled) return;
        setData([]);
        setHasMoreData(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const response = await fetchPage(paginationRef.current.activePage + 1);
      setData((prev) => [...prev, ...response]);
      setHasMoreData(response.length === ROWS_PER_PAGE);
    } catch (error) {
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div
      className={clsx(
        "tw:flex tw:h-full tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white",
        className,
      )}
    >
      {/* Lane heading — what the stage is, and how many orders wait in it. */}
      <div
        className={clsx(
          "tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2.5",
          tone.row,
        )}
      >
        <div className="tw:min-w-0 tw:flex-1">
          <h3
            className={clsx(
              "tw:truncate tw:text-xs tw:font-bold tw:uppercase tw:tracking-wider",
              tone.label,
            )}
          >
            {stage.paneLabel}
          </h3>
          <p className="tw:truncate tw:text-[11px] tw:text-slate-500">
            {stage.hint}
          </p>
        </div>
        <span className={clsx("tw:text-lg tw:font-bold", tone.count)}>
          {countLoading ? "…" : count}
        </span>
      </div>

      {/* Lane body — scrolls on its own so the board stays one screen tall. */}
      <AppScrollArea className="tw:min-h-0 tw:flex-1">
        <div className="tw:space-y-2.5 tw:p-3">
          {loading ? (
            <div className="tw:flex tw:justify-center tw:py-8">
              <AppSpinner />
            </div>
          ) : null}

          {!loading && data.length === 0 ? (
            <p className="tw:py-8 tw:text-center tw:text-xs tw:text-slate-400">
              No orders in {stage.paneLabel.toLowerCase()}
            </p>
          ) : null}

          {data.map((order) => (
            <FulfillmentOrderCard
              key={order.orderId}
              order={order}
              progress={progress}
              progressClass={tone.bar}
            />
          ))}

          {!loading && hasMoreData && (
            <LoadMoreButton
              loadMore={loadMore}
              loading={loadingMore}
              totalCount={Math.max(count, data.length)}
              loadedCount={data.length}
              loaderType="button"
              noMargin
            />
          )}
        </div>
      </AppScrollArea>
    </div>
  );
};

export default FulfillmentBoardColumn;
