import CommonService from "~/services/CommonService";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { CategoryValue } from "../../helper";

/** Where "See all" lands — this very dashboard, on the category tab. */
export const CATEGORY_BREAKDOWN_PATH = "/dashboard/inventory/dashboard";

export const CATEGORY_BREAKDOWN_QUERY = { tab: "category_wise" };

/** Row colour, wrapping round the list — the dot and its bar share it. */
export const SERIES_COLORS = [
  "#f59e0b",
  "#eab308",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#2563eb",
  "#b45309",
  "#ec4899",
  "#14b8a6",
];

export const getSeriesColor = (index: number) =>
  SERIES_COLORS[index % SERIES_COLORS.length];

/** Bar width as a share of the biggest row, floored so tiny rows stay visible. */
export const getBarWidth = (value: number, max: number) => {
  if (!max || max <= 0) return 0;
  return Math.max(Math.round(((value || 0) / max) * 100), 2);
};

/** The feed's own value key varies by response shape. */
const getCategoryValue = (item: CategoryValue) =>
  item.value ?? item.inventoryValue ?? 0;

/** A feed row with everything the list renders already worked out. */
export interface CategoryBreakdownRow extends CategoryValue {
  _key: string;
  _color: string;
  _name: string;
  _valueLabel: string;
  _barWidth: number;
  _statsLabel: string;
  /** Margin wins the right-hand slot when the feed reports one. */
  _marginLabel: string;
  _movementLabel: string;
  _movementClassName: string;
}

/**
 * Turn the raw category-value feed into rows the list can render straight out —
 * colour, compact value, bar width and the sub-line strings.
 *
 * Done once here rather than per-cell in the JSX, so the row markup stays
 * declarative and the bar scale is computed against the whole set exactly once.
 */
export const prepareCategoryRows = (
  items: CategoryValue[],
): CategoryBreakdownRow[] => {
  const values = items.map(getCategoryValue);
  const max = values.length ? Math.max(...values) : 0;

  return items.map((item, index) => {
    const value = getCategoryValue(item);
    const skus = item.totalProducts || 0;
    const fast = item.fastCount ?? item.fast ?? 0;
    const nonMoving = item.nonMovingCount ?? item.nonMoving ?? 0;

    return {
      ...item,
      _key: String(item.categoryId || item.categoryName || index),
      _color: getSeriesColor(index),
      _name: item.categoryName || "—",
      _valueLabel: CommonService.formatCompact(value),
      _barWidth: getBarWidth(value, max),
      _statsLabel: `${skus} SKUs · ${fast} fast`,
      _marginLabel:
        item.margin != null ? `${Math.round(item.margin)}% mgn` : "",
      _movementLabel: nonMoving ? `${nonMoving} non-moving` : "all moving",
      _movementClassName: nonMoving ? "tw:text-red-600" : "tw:text-emerald-600",
    };
  });
};

/**
 * Header sub-line: "9 cats · ₹6.2L". Summing only what is on screen would
 * misreport the catalogue when there is more behind "See all", so it says
 * "top N" in that case.
 */
export const prepareCategoryMeta = (
  items: CategoryValue[],
  total: number,
  loading: boolean,
) => {
  if (loading) return "Loading…";
  if (total > items.length) return `${total} cats · top ${items.length}`;

  const shownValue = items.reduce(
    (sum, item) => sum + getCategoryValue(item),
    0,
  );
  const label = total === 1 ? "cat" : "cats";
  return `${total} ${label} · ${CommonService.formatCompact(shownValue)}`;
};

/**
 * Top categories by stock value, off the same
 * `inventory-value-by-category` feed the Category tab reads — so the block and
 * the tab it opens can never disagree.
 *
 * Never throws: the block is a shortcut, not the page, so a failed feed renders
 * empty rather than taking the dashboard down.
 */
export const getCategoryBreakdown = async (
  count: number,
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<CategoryValue[]> => {
  try {
    const response =
      await InventoryDashboardService.getInventoryValueByCategory(
        {
          page: 1,
          count,
          matchFilter: {},
          sort: { value: -1 },
          ...params,
        },
        { signal },
      );
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching category breakdown:", error);
    return [];
  }
};

/** How many categories exist in total — the "9 cats" in the header. */
export const getCategoryCount = async (
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<number> => {
  try {
    const response =
      await InventoryDashboardService.getInventoryValueByCategory(
        { matchFilter: {}, ...params, outputType: "count" },
        { signal },
      );
    return Number(response?.data?.data?.total || 0);
  } catch (error) {
    console.error("Error fetching category count:", error);
    return 0;
  }
};
