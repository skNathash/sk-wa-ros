import React, { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Bell,
  Clock,
  Flame,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingDown,
  TriangleAlert,
} from "lucide-react";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import SellerCatalogService from "~/services/SellerCatalogService";
import { useSearchParams } from "react-router";

export type CatalogOverviewColor =
  | "emerald"
  | "amber"
  | "rose"
  | "yellow"
  | "violet"
  | "green"
  | "teal"
  | "slate"
  | "orange";

export interface CatalogOverviewItem {
  key: string;
  title: string;
  count: number;
  subtitle: string;
  icon: string;
  color: CatalogOverviewColor;
  onClick?: () => void;
}

interface CatalogOverviewProps {
  items?: CatalogOverviewItem[];
  onItemClick?: (item: CatalogOverviewItem) => void;
  loading?: boolean;
  className?: string;
  distance?: number | string;
  /** "grid" (default) — responsive tile grid; "list" — compact vertical rows
      for the theme-2 catalog side pane; "tabs" — horizontal filter-chip
      scroller for mobile catalog list pages (reorder / feature). */
  variant?: "grid" | "list" | "tabs";
  /** Key of the item highlighted as the current view (list / tabs variants). */
  activeKey?: string;
  /** Externally resolved counts (see {@link useCatalogOverviewCounts}); when
      provided the component skips its own fetch, so two instances on one page
      can share a single set of API calls. */
  counts?: Record<string, number>;
  /** Loading state paired with the external `counts`. */
  countsLoading?: boolean;
}

// Each data point resolves its count through its own network API call.
// Keys missing here keep the static count from `items`. Exported so the
// per-data-point feature page can reuse the same params for its list fetch.
export const catalogOverviewParamBuilders: Record<
  string,
  (params: Record<string, any>) => Record<string, any>
> = {
  reorder: (p) => SellerCatalogService.getNetworkReorderParams(p),
  // "prev-best": (p) => SellerCatalogService.getNetworkPrevBestParams(p),
  "fast-movers": (p) => SellerCatalogService.getNetworkFastMoversParams(p),
  "low-stock": (p) =>
    SellerCatalogService.getRecommendNetworkMyLowStockParams(p),
  "out-of-stock": (p) =>
    SellerCatalogService.getRecommendNetworkMyOutofStockParams(p),
  "new-launches": (p) => SellerCatalogService.getNetworkNewlyLaunchedParams(p),
  // seasonal: (p) => SellerCatalogService.getNetworkSeasonalParams(p),
  "price-drops": (p) => SellerCatalogService.getNetworkPriceDropsParams(p),
  // "clear-slow": (p) => SellerCatalogService.getNetworkClearSlowParams(p),
};

// Counts are resolved from the network APIs (see catalogOverviewParamBuilders);
// only API-backed data points are listed here. Exported so the feature page
// can resolve its title/subtitle/icon from the tapped tile's key.
export const catalogOverviewItems: CatalogOverviewItem[] = [
  {
    key: "reorder",
    title: "Reorder",
    count: 0,
    subtitle: "run out in 4d avg",
    icon: "shopping-cart",
    color: "emerald",
  },
  // {
  //   key: "prev-best",
  //   title: "Prev best",
  //   count: 0,
  //   subtitle: "top revenue · month",
  //   icon: "star",
  //   color: "amber",
  // },
  {
    key: "fast-movers",
    title: "Fast movers",
    count: 0,
    subtitle: "last 7 days · velocity",
    icon: "flame",
    color: "rose",
  },
  {
    key: "low-stock",
    title: "Low stock",
    count: 0,
    subtitle: "under min days",
    icon: "triangle-alert",
    color: "yellow",
  },
  {
    key: "out-of-stock",
    title: "Out of stock",
    count: 0,
    subtitle: "losing sales now",
    icon: "bell",
    color: "rose",
  },
  {
    key: "new-launches",
    title: "New launches",
    count: 0,
    subtitle: "from your sellers",
    icon: "sparkles",
    color: "violet",
  },
  {
    key: "price-drops",
    title: "Price drops",
    count: 0,
    subtitle: "cheaper than usual",
    icon: "trending-down",
    color: "green",
  },
  // {
  //   key: "seasonal",
  //   title: "Seasonal",
  //   count: 0,
  //   subtitle: "monsoon · rains 3 days",
  //   icon: "plus",
  //   color: "teal",
  // },
  // {
  //   key: "clear-slow",
  //   title: "Clear slow",
  //   count: 0,
  //   subtitle: "cash tied up · discount",
  //   icon: "clock",
  //   color: "slate",
  // },
];

const colorMap: Record<
  CatalogOverviewColor,
  {
    icon: string;
    border: string;
    bg: string;
    solid: string;
  }
> = {
  emerald: {
    icon: "tw:text-emerald-600",
    border: "tw:border-l-emerald-500",
    bg: "tw:bg-emerald-50",
    solid: "tw:bg-emerald-500",
  },
  amber: {
    icon: "tw:text-amber-600",
    border: "tw:border-l-amber-500",
    bg: "tw:bg-amber-50",
    solid: "tw:bg-amber-500",
  },
  rose: {
    icon: "tw:text-rose-600",
    border: "tw:border-l-rose-500",
    bg: "tw:bg-rose-50",
    solid: "tw:bg-rose-500",
  },
  yellow: {
    icon: "tw:text-yellow-600",
    border: "tw:border-l-yellow-500",
    bg: "tw:bg-yellow-50",
    solid: "tw:bg-yellow-500",
  },
  violet: {
    icon: "tw:text-violet-600",
    border: "tw:border-l-violet-500",
    bg: "tw:bg-violet-50",
    solid: "tw:bg-violet-500",
  },
  green: {
    icon: "tw:text-green-600",
    border: "tw:border-l-green-500",
    bg: "tw:bg-green-50",
    solid: "tw:bg-green-500",
  },
  teal: {
    icon: "tw:text-teal-600",
    border: "tw:border-l-teal-500",
    bg: "tw:bg-teal-50",
    solid: "tw:bg-teal-500",
  },
  slate: {
    icon: "tw:text-slate-600",
    border: "tw:border-l-slate-500",
    bg: "tw:bg-slate-50",
    solid: "tw:bg-slate-500",
  },
  orange: {
    icon: "tw:text-orange-600",
    border: "tw:border-l-orange-500",
    bg: "tw:bg-orange-50",
    solid: "tw:bg-orange-500",
  },
};

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  bell: Bell,
  clock: Clock,
  flame: Flame,
  plus: Plus,
  "shopping-cart": ShoppingCart,
  sparkles: Sparkles,
  star: Star,
  "trending-down": TrendingDown,
  "triangle-alert": TriangleAlert,
};

/**
 * Resolves the per-data-point counts behind the overview tiles. Exported so a
 * page that renders CatalogOverview more than once (e.g. the feed grid plus
 * the theme-2 side-pane list) can fetch once and pass the result down via the
 * `counts` / `countsLoading` props.
 */
export const useCatalogOverviewCounts = (
  distance: number | string = DEFAULT_BROWSE_DISTANCE,
  enabled = true,
) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setCountsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchCounts = async () => {
      setCountsLoading(true);
      const keys = Object.keys(catalogOverviewParamBuilders);
      const results = await Promise.allSettled(
        keys.map((key) =>
          SellerCatalogService.getNetworkDeals(
            catalogOverviewParamBuilders[key]({
              page: 1,
              limit: 1,
              outputType: "count",
            }),
            distance,
          ),
        ),
      );

      if (cancelled) return;

      // Every tile always renders — a failed or empty count just shows 0.
      const next: Record<string, number> = {};
      results.forEach((result, index) => {
        next[keys[index]] =
          result.status === "fulfilled" ? result.value.data?.count || 0 : 0;
      });
      setCounts(next);
      setCountsLoading(false);
    };

    fetchCounts();

    return () => {
      cancelled = true;
    };
  }, [distance, enabled]);

  return { counts, countsLoading };
};

const CatalogOverview: React.FC<CatalogOverviewProps> = ({
  items = catalogOverviewItems,
  onItemClick,
  loading = false,
  className = "",
  distance = DEFAULT_BROWSE_DISTANCE,
  variant = "grid",
  activeKey,
  counts: countsProp,
  countsLoading: countsLoadingProp,
}) => {
  const appNav = useAppNav();
  // Self-fetch only when the page didn't hand counts down.
  const fetched = useCatalogOverviewCounts(distance, countsProp == null);
  const counts = countsProp ?? fetched.counts;
  const countsLoading =
    countsProp != null ? (countsLoadingProp ?? false) : fetched.countsLoading;

  const [searchParams] = useSearchParams();

  // Default tile action — "reorder" keeps its dedicated page; every other
  // tile lands on the shared feature page for its data-point key; explicit
  // onClick / onItemClick still win. Preserve `from=compare` on feature
  // navigations so the Compare section tab stays active while switching
  // data points.
  const handleItemClick = (item: CatalogOverviewItem) => {
    if (item.onClick) return item.onClick();
    if (onItemClick) return onItemClick(item);
    if (item.key === "reorder") {
      return appNav.to("/products/buy-from-other-retailer/products/reorder", {
        distance,
      });
    }
    const from = searchParams.get("from");
    appNav.to("/products/buy-from-other-retailer/products/feature", {
      key: item.key,
      distance,
      ...(from ? { from } : {}),
    });
  };

  const resolvedItems = items.map((item) =>
    counts[item.key] != null ? { ...item, count: counts[item.key] } : item,
  );

  // Horizontal filter chips — same destinations as the grid/list tiles, used
  // on mobile reorder / feature pages where the side-pane list isn't available.
  if (variant === "tabs") {
    if (loading || countsLoading) {
      return (
        <div
          className={clsx(
            "tw:flex tw:gap-2 tw:overflow-hidden tw:px-1 tw:py-1",
            className,
          )}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`tabs-skeleton-${index}`}
              className="skeleton-loader tw:h-7 tw:w-24 tw:shrink-0 tw:rounded-full"
            />
          ))}
        </div>
      );
    }

    return (
      <FilterChipGroup className={className}>
        {resolvedItems.map((item) => {
          const IconComponent = iconMap[item.icon] ?? Package;
          return (
            <FilterChip
              key={item.key}
              active={item.key === activeKey}
              count={item.count}
              leadingIcon={<IconComponent />}
              onClick={() => handleItemClick(item)}
            >
              {item.title}
            </FilterChip>
          );
        })}
      </FilterChipGroup>
    );
  }

  if (variant === "list") {
    if (loading || countsLoading) {
      return (
        <div
          className={clsx(
            // Full-bleed: cancel the pane's 1rem side gutters so the rows and
            // their dividers run edge to edge (no card chrome around the list).
            "tw:-mx-4 tw:border-t tw:border-slate-100 tw:bg-white",
            className,
          )}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`list-skeleton-${index}`}
              className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-3 tw:py-2.5 tw:last:border-b-0"
            >
              <div className="skeleton-loader tw:size-9 tw:shrink-0 tw:rounded-lg" />
              <div className="tw:min-w-0 tw:flex-1">
                <div className="skeleton-loader tw:h-3.5 tw:w-24 tw:rounded" />
                <div className="skeleton-loader tw:mt-1 tw:h-3 tw:w-32 tw:rounded" />
              </div>
              <div className="skeleton-loader tw:h-4 tw:w-8 tw:rounded" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        className={clsx(
          // Full-bleed: cancel the pane's 1rem side gutters so the rows and
          // their dividers run edge to edge (no card chrome around the list).
          "tw:-mx-4 tw:border-t tw:border-slate-100 tw:bg-white",
          className,
        )}
      >
        {resolvedItems.map((item) => {
          const styles = colorMap[item.color] ?? colorMap.slate;
          const IconComponent = iconMap[item.icon] ?? Package;
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleItemClick(item)}
              className={clsx(
                "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors tw:last:border-b-0",
                active ? "app-list-row-active" : "tw:hover:bg-slate-50",
              )}
            >
              <span
                className={clsx(
                  "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg",
                  styles.solid,
                )}
              >
                <IconComponent className="tw:size-4 tw:text-white" />
              </span>
              <span className="tw:min-w-0 tw:flex-1">
                <span
                  className={clsx(
                    "tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800",
                  )}
                >
                  {item.title}
                </span>
                <span
                  className="tw:block tw:truncate tw:text-xs tw:text-slate-500"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {item.subtitle}
                </span>
              </span>
              <span className="app-amount tw:text-sm tw:font-bold tw:text-slate-700">
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (loading || countsLoading) {
    return (
      <div
        className={clsx(
          "tw:grid tw:grid-cols-3 tw:sm:grid-cols-3 tw:lg:grid-cols-4 tw:xl:grid-cols-5 tw:gap-3",
          className,
        )}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:gap-0 tw:sm:gap-2.5 tw:rounded-xl tw:border tw:border-slate-100 tw:border-l-4 tw:border-l-slate-200 tw:bg-white tw:p-2 tw:sm:p-2.5 tw:shadow-sm"
          >
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:sm:gap-2 tw:mb-1.5 tw:sm:mb-0 tw:sm:shrink-0">
              <div className="skeleton-loader tw:size-4 tw:sm:size-7 tw:rounded" />
              <div className="skeleton-loader tw:h-5 tw:sm:h-6 tw:w-6 tw:sm:w-6 tw:rounded" />
            </div>
            <div className="tw:min-w-0 tw:sm:flex-1">
              <div className="skeleton-loader tw:h-3 tw:sm:h-4 tw:w-12 tw:sm:w-20 tw:rounded tw:mb-1" />
              <div className="tw:space-y-1">
                <div className="skeleton-loader tw:h-2.5 tw:sm:h-3 tw:w-16 tw:sm:w-28 tw:rounded" />
                <div className="skeleton-loader tw:h-2.5 tw:sm:hidden tw:w-10 tw:rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "tw:grid tw:grid-cols-3 tw:sm:grid-cols-3 tw:lg:grid-cols-4 tw:gap-3",
        className,
      )}
    >
      {resolvedItems.map((item) => {
        const styles = colorMap[item.color] ?? colorMap.slate;
        const IconComponent = iconMap[item.icon] ?? Package;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleItemClick(item)}
            className={clsx(
              "tw:group tw:flex tw:w-full tw:cursor-pointer tw:flex-col tw:sm:flex-row tw:sm:items-center tw:gap-0 tw:sm:gap-2.5 tw:rounded-xl tw:border tw:border-slate-100 tw:border-l-4 tw:bg-white tw:p-2 tw:sm:p-2.5 tw:text-left tw:shadow-sm",
              "tw:transition-all tw:duration-200",
              "tw:hover:-translate-y-0.5 tw:hover:border-slate-200 tw:hover:shadow-md",
              "tw:focus-visible:tw:ring-2 tw:focus-visible:tw:ring-primary/50",
              styles.border,
            )}
          >
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:sm:gap-2 tw:mb-0.5 tw:sm:mb-0 tw:sm:shrink-0">
              <span
                className={clsx(
                  "tw:flex tw:size-6 tw:sm:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg",
                  styles.bg,
                )}
              >
                <IconComponent
                  className={clsx("tw:size-3.5 tw:sm:size-4", styles.icon)}
                />
              </span>
              <span className="app-amount tw:text-base tw:sm:text-xl tw:font-bold tw:leading-none tw:text-slate-900">
                {item.count}
              </span>
            </div>
            <div className="tw:min-w-0 tw:sm:flex-1">
              <h3 className="tw:text-xs tw:sm:text-sm tw:font-bold tw:text-slate-800 tw:truncate">
                {item.title}
              </h3>
              <p
                className="tw:mt-0.5 tw:text-[10px] tw:sm:text-xs tw:text-slate-500 tw:leading-snug tw:line-clamp-2 tw:sm:line-clamp-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {item.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CatalogOverview;
