import clsx from "clsx";
import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import { getMovers } from "../fast-movers/helper";
import {
  MOVERS_PATH,
  SLOW_MOVERS_QUERY,
  getTiedUpTotal,
  prepareSlowMoverRows,
  type SlowMoverRow,
} from "./helper";

const RowSkeleton = () => (
  <div className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3 tw:last:border-b-0">
    <Skeleton className="tw:size-10 tw:shrink-0 tw:rounded-lg" />
    <div className="tw:min-w-0 tw:flex-1">
      <Skeleton className="tw:h-3.5 tw:w-2/5 tw:rounded" />
      <Skeleton className="tw:mt-1.5 tw:h-2.5 tw:w-1/3 tw:rounded" />
    </div>
    <Skeleton className="tw:h-8 tw:w-16 tw:rounded" />
    <Skeleton className="tw:h-8 tw:w-28 tw:rounded-md" />
  </div>
);

interface SlowMoversProps {
  className?: string;
  /** Extra movement-feed filters (menu / category / brand). */
  params?: Record<string, any>;
  /** How many rows to pull — 6 matches the fast-movers block beside it. */
  limit?: number;
  /**
   * Fired on "See all". Handles the navigation itself when not given — pass it
   * when the host page already renders the Slow Moving tab.
   */
  onSeeAll?: () => void;
}

/**
 * "Slow movers" — the SKUs sitting on the shelf, oldest sale first so the
 * never-sold rows lead, each with the action worth taking on it.
 *
 * Product, last-sold date and stock are live off the sku-movement feed; the
 * tied-up value and the suggested action are placeholder data (see
 * `SLOW_MOVER_STATS` in `helper.ts`).
 */
const SlowMovers: React.FC<SlowMoversProps> = ({
  className = "",
  params,
  limit = 6,
  onSeeAll,
}) => {
  const appNav = useAppNav();

  const [items, setItems] = useState<SlowMoverRow[]>([]);
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
    getMovers("SLOW", limit, paramsRef.current || {}, controller.signal).then(
      (result) => {
        if (!active) return;
        // Display values are derived once, off the response — the rows below
        // only read the `_`-prefixed keys.
        setItems(prepareSlowMoverRows(result?.slice(0, 6)));
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
    appNav.to(MOVERS_PATH, SLOW_MOVERS_QUERY);
  };

  const tiedUp = getTiedUpTotal(items.length);

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:rounded-xl tw:border tw:border-amber-200 tw:bg-white",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-amber-200 tw:bg-amber-50/60 tw:px-4 tw:py-3">
        <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-amber-500 tw:text-white">
          <Info size={16} />
        </span>
        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:text-sm tw:font-semibold tw:text-gray-900">
            Slow movers
            {!loading && items.length > 0 && (
              <>
                {" · "}
                <Amount value={tiedUp} decimalPlaces={0} /> tied
              </>
            )}
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
            No slow movers — everything is selling.
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
                  {product._lastSoldLabel} · stock{" "}
                  <DisplayQty
                    qty={product._stockQty}
                    isLooseQty={product._isLooseQty}
                  />
                </p>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                <div className="tw:text-sm tw:font-semibold tw:text-amber-700">
                  <Amount value={product._tiedUp} decimalPlaces={0} />
                </div>
                <div className="tw:text-[11px] tw:text-gray-500">tied up</div>
              </div>

              {/* <span className="tw:w-[124px] tw:shrink-0 tw:rounded-md tw:bg-amber-50 tw:px-2 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-amber-800 tw:ring-1 tw:ring-amber-100">
                {product._remark}
              </span> */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SlowMovers;
