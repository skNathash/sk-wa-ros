import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import type { CategoryBreakdownRow } from "./helper";
import {
  CATEGORY_BREAKDOWN_PATH,
  CATEGORY_BREAKDOWN_QUERY,
  getCategoryBreakdown,
  getCategoryCount,
  prepareCategoryMeta,
  prepareCategoryRows,
} from "./helper";
import AppLink from "~/components/core/link/AppLink";

const RowSkeleton = () => (
  <div className="tw:border-b tw:border-gray-100 tw:px-4 tw:py-3 tw:last:border-b-0">
    <div className="tw:flex tw:items-center tw:gap-2">
      <Skeleton className="tw:size-2.5 tw:shrink-0 tw:rounded-sm" />
      <Skeleton className="tw:h-3.5 tw:w-2/5 tw:rounded" />
      <Skeleton className="tw:ms-auto tw:h-3.5 tw:w-14 tw:rounded" />
    </div>
    <Skeleton className="tw:mt-2 tw:h-1.5 tw:w-full tw:rounded-full" />
    <Skeleton className="tw:mt-2 tw:h-2.5 tw:w-1/3 tw:rounded" />
  </div>
);

interface CategoryBreakdownProps {
  className?: string;
  /** Extra filters passed through to the category-value feed. */
  params?: Record<string, any>;
  /** How many rows to pull. */
  limit?: number;
  /**
   * Fired on "See all". Handles the navigation itself when not given — pass it
   * when the host page already renders the Category tab (this dashboard does,
   * so it switches tabs instead of navigating away).
   */
  onSeeAll?: () => void;
}

/**
 * "Category-wise" — where the stock value sits, category by category, each row
 * carrying a bar scaled against the biggest category so the concentration is
 * readable at a glance.
 *
 * Value, SKU count and the movement split are live off the
 * `inventory-value-by-category` feed; margin is shown only when that feed
 * carries it.
 */
const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  className = "",
  params,
  limit = 10,
  onSeeAll,
}) => {
  const appNav = useAppNav();

  const [items, setItems] = useState<CategoryBreakdownRow[]>([]);
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
      getCategoryBreakdown(limit, paramsRef.current || {}, controller.signal),
      getCategoryCount(paramsRef.current || {}, controller.signal),
    ]).then(([rows, count]) => {
      if (!active) return;
      // Display values are derived once, off the response — the rows below only
      // read the `_`-prefixed keys.
      setItems(prepareCategoryRows(rows));
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
    appNav.to(CATEGORY_BREAKDOWN_PATH, CATEGORY_BREAKDOWN_QUERY);
  };

  const meta = prepareCategoryMeta(items, total, loading);

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
            Category-wise
          </p>
          <p className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
            Stock value · SKUs · movement split
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
            No category stock yet.
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
                  className="tw:size-2.5 tw:shrink-0 tw:rounded-sm"
                  style={{ backgroundColor: item._color }}
                />
                <span className="tw:line-clamp-1 tw:flex-1 tw:text-sm tw:font-semibold tw:text-gray-900">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/list?categoryId=${item.categoryRefId}&categoryName=${item.categoryName}`}
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
                {item._marginLabel ? (
                  <span className="tw:ms-auto tw:shrink-0 tw:font-semibold tw:text-emerald-600">
                    {item._marginLabel}
                  </span>
                ) : (
                  <span
                    className={clsx(
                      "tw:ms-auto tw:shrink-0 tw:font-semibold",
                      item._movementClassName,
                    )}
                  >
                    {item._movementLabel}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
