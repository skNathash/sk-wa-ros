import clsx from "clsx";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import {
  FAST_MOVERS_QUERY,
  MOVERS_PATH,
  getMovers,
  prepareFastMoverRows,
  type FastMoverRow,
} from "./helper";

const RowSkeleton = () => (
  <div className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3 tw:last:border-b-0">
    <Skeleton className="tw:size-10 tw:shrink-0 tw:rounded-lg" />
    <div className="tw:min-w-0 tw:flex-1">
      <Skeleton className="tw:h-3.5 tw:w-2/5 tw:rounded" />
      <Skeleton className="tw:mt-1.5 tw:h-2.5 tw:w-1/4 tw:rounded" />
    </div>
    <Skeleton className="tw:h-4 tw:w-12 tw:rounded" />
    <Skeleton className="tw:h-8 tw:w-16 tw:rounded" />
  </div>
);

interface FastMoversProps {
  className?: string;
  /** Extra movement-feed filters (menu / category / brand). */
  params?: Record<string, any>;
  /** How many rows to pull — 6 fills the block without scrolling. */
  limit?: number;
  /**
   * Fired on "See all". Handles the navigation itself when not given — pass it
   * when the host page already renders the Fast Moving tab (this dashboard
   * does, so it switches tabs instead of navigating away).
   */
  onSeeAll?: () => void;
}

/**
 * "Fast movers" — the SKUs earning right now, ranked by units sold in the last
 * 7 days.
 *
 * Product and weekly units are live off the sku-movement feed; the
 * stock-value / days-of-cover column on the right is placeholder data (see
 * `FAST_MOVER_STATS` in `helper.ts`) until an endpoint carries landed cost.
 */
const FastMovers: React.FC<FastMoversProps> = ({
  className = "",
  params,
  limit = 6,
  onSeeAll,
}) => {
  const appNav = useAppNav();

  const [items, setItems] = useState<FastMoverRow[]>([]);
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
    getMovers("FAST", limit, paramsRef.current || {}, controller.signal).then(
      (result) => {
        if (!active) return;
        // Display values are derived once, off the response — the rows below
        // only read the `_`-prefixed keys.
        setItems(prepareFastMoverRows(result?.slice(0, 6)));
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
    appNav.to(MOVERS_PATH, FAST_MOVERS_QUERY);
  };

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:rounded-xl tw:border tw:border-emerald-200 tw:bg-white",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-emerald-200 tw:bg-emerald-50/60 tw:px-4 tw:py-3">
        <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-emerald-600 tw:text-white">
          <ArrowUpRight size={16} />
        </span>
        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:text-sm tw:font-semibold tw:text-gray-900">
            Fast movers · top {limit} by 7d units
          </p>
          <p className="tw:text-xs tw:text-gray-600">
            These earn — protect their shelf space + reorder proactively
          </p>
        </div>
        {/* Nothing to see all of until rows land. */}
        {!loading && items.length > 0 && (
          <button
            type="button"
            onClick={handleSeeAll}
            className="tw:shrink-0 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-gray-700 tw:transition-colors tw:hover:bg-gray-50"
          >
            See all →
          </button>
        )}
      </div>

      <div>
        {loading ? (
          Array.from({ length: limit }, (_, i) => <RowSkeleton key={i} />)
        ) : items.length === 0 ? (
          <p className="tw:px-4 tw:py-6 tw:text-center tw:text-sm tw:text-gray-500">
            No fast movers yet.
          </p>
        ) : (
          items.map((product, index) => (
            <div
              key={product._key}
              className={clsx(
                "tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-2.5 tw:last:border-b-0",
                index % 2 === 1 && "tw:bg-gray-50/60",
              )}
            >
              <span
                className={clsx(
                  "tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-[10px] tw:font-bold tw:text-white",
                  product._avatarColor,
                )}
              >
                {product._avatarLabel}
              </span>

              <div className="tw:min-w-0 tw:flex-1">
                <AppLink
                  asLink
                  href={`/dashboard/inventory/products/view/${product.dealId}`}
                >
                  <span className="tw:line-clamp-1 tw:text-sm tw:font-semibold tw:text-gray-900">
                    {product.dealName}
                  </span>
                </AppLink>
                <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-gray-500">
                  {product._categoryLabel} · stock{" "}
                  <DisplayQty
                    qty={product._stockQty}
                    isLooseQty={product._isLooseQty}
                  />
                </p>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                <span className="tw:text-sm tw:font-bold tw:text-gray-900">
                  <DisplayQty
                    qty={product._weeklyUnits}
                    isLooseQty={product._isLooseQty}
                  />
                </span>
                <span className="tw:text-[11px] tw:text-gray-500">/wk</span>
              </div>

              <div className="tw:w-[92px] tw:shrink-0 tw:text-right">
                <div
                  className={clsx(
                    "tw:text-sm tw:font-semibold",
                    product._statUrgent
                      ? "tw:text-emerald-700"
                      : "tw:text-gray-800",
                  )}
                >
                  <Amount value={product._statValue} decimalPlaces={0} />
                </div>
                <div
                  className={clsx(
                    "tw:mt-0.5 tw:flex tw:items-center tw:justify-end tw:gap-1 tw:text-[11px]",
                    product._statUrgent
                      ? "tw:text-red-600"
                      : "tw:text-gray-500",
                  )}
                >
                  {product._statUrgent && <TriangleAlert size={11} />}
                  {product._statCover}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FastMovers;
