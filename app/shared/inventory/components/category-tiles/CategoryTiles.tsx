import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import TintTile from "~/components/core/tint/TintTile";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import {
  CATEGORY_LIST_PATH,
  getCategoryListQuery,
  getCategoryTiles,
  type CategoryTileItem,
} from "./helper";

const TileSkeleton = () => (
  <div>
    <Skeleton className="tw:aspect-square tw:w-full tw:rounded-2xl" />
    <Skeleton className="tw:mt-2 tw:h-3.5 tw:w-2/3 tw:rounded" />
  </div>
);

interface CategoryTilesProps {
  className?: string;
  /** Heading on the card. */
  title?: string;
  /** Extra seller-deal filters applied to the category feed. */
  params?: Record<string, any>;
  /** How many tiles to pull — 9 fills three rows of three on desktop. */
  limit?: number;
  /**
   * Fired on tile tap. Handles the navigation itself when not given — pass it
   * when the host page already renders the filtered list.
   */
  onCategoryClick?: (category: CategoryTileItem) => void;
}

/**
 * "Your categories" — the seller's catalogue split by category as a grid of
 * tinted tiles, each carrying its initial and the number of deals under it.
 *
 * Tapping a tile opens the product list filtered to that category, using the
 * same `categoryId` / `categoryName` params the list's own facet filter writes,
 * so the destination shows the selection as an applied filter chip.
 */
const CategoryTiles: React.FC<CategoryTilesProps> = ({
  className = "",
  title = "Your categories",
  params,
  limit = 9,
  onCategoryClick,
}) => {
  const appNav = useAppNav();

  const [items, setItems] = useState<CategoryTileItem[]>([]);
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
    getCategoryTiles(limit, paramsRef.current || {}, controller.signal).then(
      (result) => {
        if (!active) return;
        setItems(result);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      controller.abort();
    };
  }, [paramsKey, limit]);

  const handleSelect = (category: CategoryTileItem) => {
    if (onCategoryClick) {
      onCategoryClick(category);
      return;
    }
    appNav.to(CATEGORY_LIST_PATH, getCategoryListQuery(category));
  };

  if (!loading && items.length === 0) return null;

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-200 tw:px-4 tw:py-3">
        <p className="tw:text-base tw:font-bold tw:text-gray-900">{title}</p>
        <p className="tw:shrink-0 tw:text-xs tw:text-gray-500">
          {loading
            ? "Loading…"
            : `${items.length} ${
                items.length === 1 ? "category" : "categories"
              } · click to filter`}
        </p>
      </div>

      <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:p-4 tw:sm:grid-cols-3 tw:lg:grid-cols-4">
        {loading
          ? Array.from({ length: limit }).map((_, i) => <TileSkeleton key={i} />)
          : items.map((item, idx) => (
              <button
                key={item._id}
                type="button"
                onClick={() => handleSelect(item)}
                title={item._displayName || item.name}
                className="tw:group tw:cursor-pointer tw:text-left tw:outline-none"
              >
                <TintTile
                  index={idx}
                  className="tw:aspect-square tw:w-full tw:rounded-2xl tw:transition-transform tw:duration-150 tw:group-hover:-translate-y-0.5 tw:group-focus-visible:ring-2 tw:group-focus-visible:ring-emerald-500"
                >
                  <span className="tw:flex tw:size-1/2 tw:items-center tw:justify-center tw:rounded-xl tw:bg-white/80 tw:text-2xl tw:font-bold">
                    {item._initial}
                  </span>

                  <span className="tw:absolute tw:right-2 tw:bottom-2 tw:rounded-md tw:bg-white/85 tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-bold tw:text-[color:var(--tint-ink)]">
                    {item.dealsCount.toLocaleString("en-IN")}
                  </span>
                </TintTile>

                <span className="tw:mt-2 tw:block tw:truncate tw:text-[13px] tw:font-bold tw:text-gray-900">
                  {item._displayName || item.name}
                </span>
              </button>
            ))}
      </div>
    </div>
  );
};

export default CategoryTiles;
export type { CategoryTileItem };
