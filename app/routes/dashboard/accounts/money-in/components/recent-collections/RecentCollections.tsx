import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import ListSkeleton from "~/shared/accounts/components/list-skeleton/ListSkeleton";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState } from "~/types/CommonTypes";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import {
  defaultRange,
  getCount,
  getData,
  pageSize,
  prepareParams,
  type Collection,
} from "./helper";

type RecentCollectionsProps = {
  /** Range the feed is read for (yyyy-MM-dd); the API scopes receipts to it. */
  startDate?: string;
  endDate?: string;
  /** Row taps bubble up; the page owns the payment view modal. */
  callback?: (payload: { action: string; data?: any }) => void;
};

// The collections feed: what came in, from whom and through which mode — rows
// open to show the ledger and instrument references behind the receipt.
const RecentCollections = ({
  startDate = defaultRange.startDate,
  endDate = defaultRange.endDate,
  callback,
}: RecentCollectionsProps) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const [data, setData] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: pageSize,
    startSlNo: 1,
    endSlNo: pageSize,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({ startDate, endDate });

  // Apply filter (initial load or range change)
  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    setExpanded(null);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setData(result);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length < totalRecords);
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
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setData((prev) => {
        const next = [...prev, ...result];
        setHasMoreData(next.length < paginationRef.current.totalRecords);
        return next;
      });
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  /* The range is read by the API, so changing it starts the feed again from
     the first page. */
  useEffect(() => {
    filterRef.current = { ...filterRef.current, startDate, endDate };
    applyFilter();
  }, [startDate, endDate, applyFilter]);

  const toggle = (item: Collection) => {
    setExpanded((prev) => (prev === item.id ? null : item.id));
    callback?.({ action: "viewCollection", data: item });
  };

  /* The total lands on the ref a beat after the first page, so fall back to
     what has been read while the count is still in flight. */
  const totalCount = paginationRef.current.totalRecords || data.length;

  return (
    /* Mobile has no card shell — the rows bleed to the screen edges and the
       header sits on the page background. The card returns from md up. */
    <div className="tw:mb-3 tw:md:overflow-hidden tw:md:rounded-2xl tw:md:bg-white tw:md:shadow-sm">
      {/* One header for both widths: on mobile it sits bare on the page
          background so the sheet below reads as the block itself; from md up it
          gains the card's padding and hairline rule. */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-2 tw:md:border-b tw:md:border-gray-100 tw:md:px-4 tw:md:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("recentCollections")}
        </div>
        {/* <div className="tw:text-[11px] tw:text-gray-500">
          {data.length} / {totalCount}
        </div> */}
      </div>

      {loading ? (
        /* Receipt rows lead with the party name, not an avatar. */
        <ListSkeleton avatar={false} />
      ) : (
        <>
          {/* Desktop prints the full ledger row — date, party, ref, mode,
              amount; mobile folds date and reference under the party line. */}
          {isMobile ? (
            <MobileView data={data} expanded={expanded} toggle={toggle} />
          ) : (
            <DesktopView data={data} expanded={expanded} toggle={toggle} />
          )}

          {/* More receipts sit in the range than have been read so far. */}
          {hasMoreData && (
            <div className="tw:pt-3 tw:md:border-t tw:md:border-gray-100 tw:md:px-4 tw:md:pt-0 tw:md:pb-3">
              <LoadMoreButton
                loaderType="button"
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecentCollections;
