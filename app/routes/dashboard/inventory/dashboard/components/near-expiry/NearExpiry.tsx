import clsx from "clsx";
import { CalendarClock, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AppLink from "~/components/core/link/AppLink";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import {
  NEAR_EXPIRY_PATH,
  NEAR_EXPIRY_QUERY,
  getNearExpiryItems,
  prepareNearExpiryRows,
  type NearExpiryRow,
} from "./helper";

const RowSkeleton = () => (
  <div className="tw:border-b tw:border-gray-100 tw:px-4 tw:py-3 tw:last:border-b-0">
    <div className="tw:flex tw:items-center tw:gap-3">
      <Skeleton className="tw:size-10 tw:shrink-0 tw:rounded-full" />
      <div className="tw:min-w-0 tw:flex-1">
        <Skeleton className="tw:h-3.5 tw:w-2/5 tw:rounded" />
        <Skeleton className="tw:mt-1.5 tw:h-2.5 tw:w-1/3 tw:rounded" />
      </div>
      <Skeleton className="tw:h-3.5 tw:w-10 tw:rounded" />
    </div>
    <Skeleton className="tw:mt-2 tw:h-7 tw:w-full tw:rounded-md" />
  </div>
);

interface NearExpiryProps {
  className?: string;
  /** Extra filters passed through to the expiry-risk feed. */
  params?: Record<string, any>;
  /** How many rows to pull. */
  limit?: number;
  /**
   * Fired on "See all". Handles the navigation itself when not given — pass it
   * when the host page already renders the Near Expiry view (this dashboard
   * does, so it switches tabs instead of navigating away).
   */
  onSeeAll?: () => void;
}

/**
 * "Near expiry" — the stock running out of shelf life, each row carrying the
 * date, the countdown and the action worth taking before it is written off.
 *
 * Product and stock are live off the `expiryRisk` feed; the expiry countdown and
 * the suggested action are placeholder data (see `NEAR_EXPIRY_STATS` in
 * `helper.ts`).
 */
const NearExpiry: React.FC<NearExpiryProps> = ({
  className = "",
  params,
  limit = 10,
  onSeeAll,
}) => {
  const appNav = useAppNav();

  const [items, setItems] = useState<NearExpiryRow[]>([]);
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
    getNearExpiryItems(limit, paramsRef.current || {}, controller.signal).then(
      (result) => {
        if (!active) return;
        // Display values are derived once, off the response — the rows below
        // only read the `_`-prefixed keys.
        setItems(prepareNearExpiryRows(result));
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
    appNav.to(NEAR_EXPIRY_PATH, NEAR_EXPIRY_QUERY);
  };

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:rounded-xl tw:border tw:border-amber-200 tw:bg-white",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-amber-200 tw:bg-amber-50/60 tw:px-4 tw:py-3">
        <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-amber-500 tw:text-white">
          <CalendarClock size={16} />
        </span>
        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:text-sm tw:font-semibold tw:text-gray-900">
            Near expiry · 30d
            {!loading && items.length > 0 && (
              <span className="tw:ms-2 tw:rounded tw:bg-amber-600 tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-bold tw:text-white">
                {items.length}
              </span>
            )}
          </p>
          <p className="tw:text-xs tw:text-gray-600">
            Push, bundle, or delist before write-off
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeeAll}
          className="tw:shrink-0 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-gray-700 tw:transition-colors tw:hover:bg-gray-50"
        >
          See all →
        </button>
      </div>

      <div>
        {loading ? (
          Array.from({ length: 4 }, (_, i) => <RowSkeleton key={i} />)
        ) : items.length === 0 ? (
          <p className="tw:px-4 tw:py-6 tw:text-center tw:text-sm tw:text-gray-500">
            Nothing expiring in the next 30 days.
          </p>
        ) : (
          items.map((product) => (
            <div
              key={product._key}
              className={clsx(
                "tw:border-b tw:border-s-4 tw:border-gray-100 tw:px-4 tw:py-2.5 tw:last:border-b-0",
                product._critical
                  ? "tw:border-s-red-500"
                  : "tw:border-s-amber-400",
              )}
            >
              <div className="tw:flex tw:items-center tw:gap-3">
                <span
                  className={clsx(
                    "tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[10px] tw:font-bold tw:text-white",
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
                  <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:font-semibold tw:text-amber-800">
                    Exp {product._expiryDate} ·{" "}
                    <span
                      className={clsx(
                        product._critical
                          ? "tw:text-red-600"
                          : "tw:text-amber-700",
                      )}
                    >
                      {product._daysLeft}d left
                    </span>
                  </p>
                </div>

                <div className="tw:shrink-0 tw:text-sm tw:font-semibold tw:text-gray-900">
                  <DisplayQty
                    qty={product._stockQty}
                    isLooseQty={product._isLooseQty}
                  />
                </div>
              </div>

              <div className="tw:mt-2 tw:flex tw:items-center tw:gap-1.5 tw:rounded-md tw:bg-amber-50 tw:px-2 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-amber-800 tw:ring-1 tw:ring-amber-100">
                {product._urgent && (
                  <TriangleAlert size={13} className="tw:shrink-0" />
                )}
                <span className="tw:truncate">{product._remark}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NearExpiry;
