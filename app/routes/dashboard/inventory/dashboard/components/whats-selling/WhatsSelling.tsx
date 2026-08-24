import clsx from "clsx";
import { PackageSearch, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import NoData from "~/components/core/no-data/NoData";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import {
  WHATS_SELLING_PATH,
  WHATS_SELLING_QUERY,
  getSellingDeals,
  prepareSellingTiles,
  type SellingTile,
} from "./helper";

const TileSkeleton = () => (
  <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-3">
    <div className="tw:flex tw:items-center tw:gap-2">
      <Skeleton className="tw:size-9 tw:shrink-0 tw:rounded-lg" />
      <div className="tw:min-w-0 tw:flex-1">
        <Skeleton className="tw:h-3.5 tw:w-3/5 tw:rounded" />
        <Skeleton className="tw:mt-1.5 tw:h-2.5 tw:w-2/5 tw:rounded" />
      </div>
    </div>
    <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2">
      <Skeleton className="tw:h-5 tw:w-20 tw:rounded" />
      <Skeleton className="tw:ms-auto tw:h-3 tw:w-10 tw:rounded" />
    </div>
  </div>
);

interface WhatsSellingProps {
  className?: string;
  /** Extra deal-feed filters (menu / category / brand). */
  params?: Record<string, any>;
  /** How many tiles to pull — 8 fills two rows on desktop. */
  limit?: number;
  /**
   * Fired on "Full analytics". Handles the navigation itself when not given —
   * pass it when the host page already renders the Fast Moving view (this
   * dashboard does, so it switches tabs instead of navigating away).
   */
  onSeeAll?: () => void;
}

/**
 * "What's selling" — the last 7 days as a wall of tiles, biggest seller first,
 * each carrying the units, the value earned and which way it is moving against
 * the week before.
 *
 * Everything on a tile is live off the seller-deals feed's
 * `salesAnalytics.last7Days`; the tiles that climbed 10%+ get the HOT flag.
 * Tapping one opens that item; "Full analytics" opens the Fast Moving view.
 */
const WhatsSelling: React.FC<WhatsSellingProps> = ({
  className = "",
  params,
  limit = 8,
  onSeeAll,
}) => {
  const appNav = useAppNav();

  const [items, setItems] = useState<SellingTile[]>([]);
  const [loading, setLoading] = useState(true);

  // Callers rebuild `params` on every render, so the effect keys off its
  // serialised form instead of the object reference.
  const paramsKey = JSON.stringify(params || {});
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    getSellingDeals(limit, paramsRef.current || {}, controller.signal).then(
      (result) => {
        if (!active) return;
        // Display values are derived once, off the response — the tiles below
        // only read the `_`-prefixed keys.
        setItems(prepareSellingTiles(result));
        setLoading(false);
      },
    );

    return () => {
      active = false;
      controller.abort();
    };
  }, [paramsKey, limit]);

  const handleSeeAll = () => {
    if (onSeeAll) {
      onSeeAll();
      return;
    }
    appNav.to(WHATS_SELLING_PATH, WHATS_SELLING_QUERY);
  };

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white",
        className,
      )}
    >
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:border-b tw:border-gray-200 tw:px-4 tw:py-3">
        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:text-base tw:font-bold tw:text-gray-900">
            What&apos;s selling · last 7 days
          </p>
          <p className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
            Top brands in your catalog · click to inspect
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeeAll}
          className="tw:shrink-0 tw:cursor-pointer tw:rounded-lg tw:border tw:border-gray-300 tw:bg-white tw:px-3 tw:py-1.5 tw:text-xs tw:font-bold tw:text-gray-800 tw:transition-colors tw:hover:bg-gray-50"
        >
          Full analytics →
        </button>
      </div>

      {/* Half-width at xl (it shares that row with the category tiles), so the
          columns step back down instead of up. */}
      <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:p-4 tw:md:grid-cols-3 tw:xl:grid-cols-2">
        {loading ? (
          Array.from({ length: limit }, (_, i) => <TileSkeleton key={i} />)
        ) : items.length === 0 ? (
          <NoData
            className="tw:col-span-full tw:py-8"
            title="Nothing sold in the last 7 days"
            description="Once sales start coming in, your top movers show up here with their units, value and week-on-week trend."
            icon={
              <div className="tw:rounded-full tw:border tw:border-gray-200 tw:bg-gray-50 tw:p-4">
                <PackageSearch className="tw:text-gray-400" size={32} />
              </div>
            }
          />
        ) : (
          items.map((deal) => (
            <button
              key={deal._key}
              type="button"
              onClick={() =>
                appNav.to(`/dashboard/inventory/products/view/${deal.dealId}`)
              }
              className={clsx(
                "tw:relative tw:cursor-pointer tw:rounded-xl tw:border tw:p-3 tw:text-left tw:transition-shadow tw:hover:shadow-md",
                deal._color.card,
              )}
            >
              {deal._isHot && (
                <span className="tw:absolute tw:-top-1.5 tw:end-2 tw:rounded tw:bg-amber-400 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:text-white">
                  HOT
                </span>
              )}

              <div className="tw:flex tw:items-center tw:gap-2">
                <span
                  className={clsx(
                    "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-[10px] tw:font-bold",
                    deal._color.badge,
                  )}
                >
                  {deal._label}
                </span>
                <div className="tw:min-w-0 tw:flex-1">
                  <p className="tw:line-clamp-1 tw:text-sm tw:font-bold tw:text-gray-900">
                    {deal._name}
                  </p>
                  <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-gray-500">
                    <DisplayQty
                      qty={deal._unitsSold}
                      isLooseQty={deal._isLooseQty}
                    />{" "}
                    units sold
                  </p>
                </div>
              </div>

              <div className="tw:mt-2.5 tw:flex tw:items-end tw:gap-2">
                <span
                  className={clsx("tw:text-lg tw:font-bold", deal._color.text)}
                >
                  <Amount value={deal._valueSold} decimalPlaces={0} />
                </span>
                <span
                  className={clsx(
                    "tw:ms-auto tw:flex tw:shrink-0 tw:items-center tw:gap-0.5 tw:text-[11px] tw:font-bold",
                    deal._trendUp ? "tw:text-emerald-700" : "tw:text-red-600",
                  )}
                >
                  {deal._trendUp ? (
                    <TrendingUp size={11} />
                  ) : (
                    <TrendingDown size={11} />
                  )}
                  {deal._trendPct}%
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default WhatsSelling;
