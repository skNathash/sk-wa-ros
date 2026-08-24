import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import type { BrandBreakdownRow } from "./helper";
import {
  BRAND_BREAKDOWN_PATH,
  BRAND_BREAKDOWN_QUERY,
  getBrandBreakdown,
  getBrandCount,
  prepareBrandMeta,
  prepareBrandRows,
} from "./helper";
import AppLink from "~/components/core/link/AppLink";

const RowSkeleton = () => (
  <div className="tw:border-b tw:border-gray-100 tw:px-4 tw:py-3 tw:last:border-b-0">
    <div className="tw:flex tw:items-center tw:gap-2">
      <Skeleton className="tw:size-5 tw:shrink-0 tw:rounded-md" />
      <Skeleton className="tw:h-3.5 tw:w-2/5 tw:rounded" />
      <Skeleton className="tw:ms-auto tw:h-3.5 tw:w-14 tw:rounded" />
    </div>
    <Skeleton className="tw:mt-2 tw:h-1.5 tw:w-full tw:rounded-full" />
    <Skeleton className="tw:mt-2 tw:h-2.5 tw:w-1/3 tw:rounded" />
  </div>
);

interface BrandBreakdownProps {
  className?: string;
  /** Extra filters passed through to the brand-value feed. */
  params?: Record<string, any>;
  /** How many rows to pull. */
  limit?: number;
  /**
   * Fired on "See all". Handles the navigation itself when not given — pass it
   * when the host page already renders the Brand tab (this dashboard does, so
   * it switches tabs instead of navigating away).
   */
  onSeeAll?: () => void;
}

/**
 * "Brand-wise" — how the stock value concentrates across brands, each row
 * carrying a bar scaled against the biggest brand so a top-heavy catalogue is
 * obvious at a glance.
 *
 * Value, SKU count and the movement split are live off the
 * `inventory-value-by-brand` feed — the same one the Brand tab reads.
 */
const BrandBreakdown: React.FC<BrandBreakdownProps> = ({
  className = "",
  params,
  limit = 10,
  onSeeAll,
}) => {
  const appNav = useAppNav();

  const [items, setItems] = useState<BrandBreakdownRow[]>([]);
  const [total, setTotal] = useState(0);
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
    Promise.all([
      getBrandBreakdown(limit, paramsRef.current || {}, controller.signal),
      getBrandCount(paramsRef.current || {}, controller.signal),
    ]).then(([rows, count]) => {
      if (!active) return;
      // Display values are derived once, off the response — the rows below only
      // read the `_`-prefixed keys.
      setItems(prepareBrandRows(rows));
      setTotal(count || rows.length);
      setLoading(false);
    });

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
    appNav.to(BRAND_BREAKDOWN_PATH, BRAND_BREAKDOWN_QUERY);
  };

  const meta = prepareBrandMeta(items, total, loading);

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white",
        className,
      )}
    >
      <div className="tw:flex tw:items-start tw:gap-3 tw:border-b tw:border-gray-200 tw:px-4 tw:py-3">
        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:text-base tw:font-bold tw:text-gray-900">
            Brand-wise
          </p>
          <p className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
            Concentration · SKUs · movement split
          </p>
        </div>
        <div className="tw:shrink-0 tw:text-right">
          <p className="tw:text-xs tw:text-gray-500">{meta}</p>
          <button
            type="button"
            onClick={handleSeeAll}
            className="tw:mt-1 tw:cursor-pointer tw:text-xs tw:font-semibold tw:text-primary tw:hover:underline"
          >
            See all →
          </button>
        </div>
      </div>

      <div>
        {loading ? (
          Array.from({ length: 5 }, (_, i) => <RowSkeleton key={i} />)
        ) : items.length === 0 ? (
          <p className="tw:px-4 tw:py-6 tw:text-center tw:text-sm tw:text-gray-500">
            No brand stock yet.
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={item._key}
              className={clsx(
                "tw:border-b tw:border-gray-100 tw:px-4 tw:py-2.5 tw:last:border-b-0",
                index % 2 === 1 && "tw:bg-gray-50/60",
              )}
            >
              <div className="tw:flex tw:items-center tw:gap-2">
                <span
                  className="tw:flex tw:size-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:text-[10px] tw:font-bold"
                  style={{
                    backgroundColor: `${item._color}1a`,
                    color: item._color,
                  }}
                >
                  {item._monogram}
                </span>
                <span className="tw:line-clamp-1 tw:flex-1 tw:text-sm tw:font-semibold tw:text-gray-900">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/list?brandId=${item.brandRefId}&brandName=${item.brandName}`}
                  >
                    {item._name}
                  </AppLink>
                </span>
                <span
                  className="tw:shrink-0 tw:text-sm tw:font-bold"
                  style={{ color: item._color }}
                >
                  {item._valueLabel}
                </span>
              </div>

              <div className="tw:mt-1.5 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
                <div
                  className="tw:h-full tw:rounded-full"
                  style={{
                    width: `${item._barWidth}%`,
                    backgroundColor: item._color,
                  }}
                />
              </div>

              <div className="tw:mt-1.5 tw:flex tw:items-center tw:gap-2 tw:text-xs">
                <span className="tw:truncate tw:text-gray-500">
                  {item._statsLabel}
                </span>
                <span
                  className={clsx(
                    "tw:ms-auto tw:shrink-0 tw:font-semibold",
                    item._movementClassName,
                  )}
                >
                  {item._movementLabel}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BrandBreakdown;
