import { Radio } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import MiscService from "~/services/MiscService";
import ShareService from "~/services/ShareService";
import {
  coinChipRange,
  type CoinChipKey,
} from "~/shared/coins/components/coin-store-pane/helper";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import { buildHolderNudgeMessage } from "../../helper";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams, type CoinHolder } from "./helper";

interface TopCoinHoldersProps {
  /** Name filter from the pane's search box. */
  search?: string;
  /** Coin band picked in the pane's chip strip. */
  band?: CoinChipKey;
}

/**
 * "Top coin holders" — every holder with coins in hand, biggest wallet first,
 * with how far each is from their next reward and a one-tap share that carries
 * that gap into WhatsApp.
 *
 * The feed pages server-side but takes no search or band filter, so the pane's
 * search box and chips narrow the pages already loaded.
 */
const TopCoinHolders = ({ search = "", band = "all" }: TopCoinHoldersProps) => {
  const { isMobile } = useScreenView();

  const [data, setData] = useState<CoinHolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<Record<string, any>>({});

  const applyFilter = useCallback(async () => {
    setLoading(true);
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
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);

      paginationRef.current.totalRecords = await getCount(params);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
    }
  }, []);

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
      setData((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  /** The loaded rows narrowed to what the pane's search and chip ask for. */
  const visibleData = useMemo(() => {
    const term = search.trim().toLowerCase();
    const range = coinChipRange(band);

    return data.filter((holder) => {
      if (term && !holder.name.toLowerCase().includes(term)) return false;
      if (range.min !== undefined && holder.available < range.min) return false;
      if (range.max !== undefined && holder.available > range.max) return false;
      return true;
    });
  }, [band, data, search]);

  const isNarrowed = visibleData.length !== data.length;

  /** Share the holder's standing and the gap to their next reward. */
  const handleAction = useCallback(
    (payload: { action: string; data: CoinHolder }) => {
      if (payload.action === "share") {
        ShareService.share({
          msg: buildHolderNudgeMessage(
            payload.data.name,
            payload.data.available,
          ),
        });
      }
    },
    [],
  );

  /** Reuses the invite/broadcast modal the Coin Store page opens. */
  const handleBroadcast = () => {
    MiscService.createEvent("showInviteModal", null);
  };

  return (
    <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-4 tw:shadow-sm tw:md:p-5">
      <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between tw:gap-3">
        <div className="tw:min-w-0">
          <div className="tw:text-base tw:font-semibold tw:text-slate-800">
            Top coin holders · one-tap nudge
          </div>
          {/* Paging is server-side, so the summary counts the full feed; say so
              when the pane's filters have narrowed what is on screen. */}
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
          {isNarrowed && (
            <div className="tw:mt-0.5 tw:text-xs tw:text-slate-400">
              Showing {visibleData.length} of the {data.length} loaded holders
            </div>
          )}
        </div>

        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
          <ViewToggle viewType={viewType} callback={setViewType} />
          <AppButton size="small" color="light" fill="outline" onClick={handleBroadcast}>
            <Radio size={16} />
            Broadcast all
          </AppButton>
        </div>
      </div>

      {isMobile || viewType === "card" ? (
        <MobileView
          data={visibleData}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          hasMoreData={hasMoreData}
          callback={handleAction}
        />
      ) : (
        <DesktopView
          data={visibleData}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          hasMoreData={hasMoreData}
          callback={handleAction}
        />
      )}
    </div>
  );
};

export default TopCoinHolders;
