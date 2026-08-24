import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import {
  getWallets,
  SEGMENTS,
  type LiveWalletRow,
  type SegmentKey,
} from "./helper";

const ROWS = 6;

/**
 * Live wallets — the open paylater wallets with how much of each limit is
 * drawn, the balance owed and when it falls due, segmented by wallet type.
 *
 * Reads the same paylater request list the B2C/B2B wallets pages use; renders
 * as a table on desktop and stacked cards on mobile.
 */
const LiveWallets = () => {
  const { isMobile } = useScreenView();

  const [segment, setSegment] = useState<SegmentKey>("all");
  const [data, setData] = useState<LiveWalletRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: ROWS,
    startSlNo: 1,
    endSlNo: ROWS,
    totalRecords: 0,
  });

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setData([]);
    try {
      const { rows, total: count } = await getWallets(
        segment,
        paginationRef.current,
      );
      setData(rows);
      setTotal(count);
    } catch (e) {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [segment]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const segmentPills = (
    <div className="tw:flex tw:items-center tw:gap-1.5">
      {SEGMENTS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => setSegment(item.key)}
          className={clsx(
            "tw:rounded-full tw:px-3 tw:py-1 tw:text-xs tw:font-medium",
            segment === item.key
              ? "tw:bg-primary tw:text-white"
              : "tw:bg-slate-100 tw:text-slate-600 tw:hover:bg-slate-200",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <div>
        {/* Header sits above the card on mobile — count first, then the type pills. */}
        <div className="tw:mb-2 tw:flex tw:items-center tw:justify-between tw:gap-3">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
            <span className="tw:text-slate-700">{total}</span> Wallets · Live
          </div>
          {segmentPills}
        </div>

        <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm">
          <MobileView data={data} loading={loading} />
        </div>
      </div>
    );
  }

  return (
    <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
        <div className="tw:text-base tw:font-semibold tw:text-slate-800">
          Live wallets · {total}
        </div>
        {segmentPills}
      </div>

      <DesktopView data={data} loading={loading} />
    </div>
  );
};

export default LiveWallets;
