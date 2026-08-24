import CommonService from "~/services/CommonService";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { BrandValue } from "../../helper";

/** Where "See all" lands — this very dashboard, on the brand tab. */
export const BRAND_BREAKDOWN_PATH = "/dashboard/inventory/dashboard";

export const BRAND_BREAKDOWN_QUERY = { tab: "brand_wise" };

/** Row colour, wrapping round the list — the monogram and its bar share it. */
export const SERIES_COLORS = [
  "#f59e0b",
  "#0ea5e9",
  "#ef4444",
  "#3b82f6",
  "#eab308",
  "#e11d48",
  "#2563eb",
  "#10b981",
  "#8b5cf6",
  "#14b8a6",
];

export const getSeriesColor = (index: number) =>
  SERIES_COLORS[index % SERIES_COLORS.length];

/** First letter of the brand, painted in the monogram square. */
export const getMonogram = (name: string) =>
  (name || "?").trim().charAt(0).toUpperCase() || "#";

/** Bar width as a share of the biggest row, floored so tiny rows stay visible. */
export const getBarWidth = (value: number, max: number) => {
  if (!max || max <= 0) return 0;
  return Math.max(Math.round(((value || 0) / max) * 100), 2);
};

/** A feed row with everything the list renders already worked out. */
export interface BrandBreakdownRow extends BrandValue {
  _key: string;
  _color: string;
  _monogram: string;
  _name: string;
  _valueLabel: string;
  _barWidth: number;
  _statsLabel: string;
  _movementLabel: string;
  _movementClassName: string;
}

/**
 * Turn the raw brand-value feed into rows the list can render straight out —
 * colour, monogram, compact value, bar width and the two sub-line strings.
 *
 * Done once here rather than per-cell in the JSX, so the row markup stays
 * declarative and the bar scale is computed against the whole set exactly once.
 */
export const prepareBrandRows = (items: BrandValue[]): BrandBreakdownRow[] => {
  const values = items.map((item) => item.value || 0);
  const max = values.length ? Math.max(...values) : 0;

  return items.map((item, index) => {
    const value = item.value || 0;
    const color = getSeriesColor(index);
    const skus = item.totalProducts || 0;
    const fast = item.fastCount ?? item.fast ?? 0;
    const nonMoving = item.nonMovingCount ?? item.nonMoving ?? 0;

    return {
      ...item,
      _key: String(item.brandId || item.brandName || index),
      _color: color,
      _monogram: getMonogram(item.brandName),
      _name: item.brandName || "—",
      _valueLabel: CommonService.formatCompact(value),
      _barWidth: getBarWidth(value, max),
      _statsLabel: `${skus} SKUs · ${fast} fast`,
      _movementLabel: nonMoving ? `${nonMoving} non-moving` : "all moving",
      _movementClassName: nonMoving ? "tw:text-red-600" : "tw:text-emerald-600",
    };
  });
};

/**
 * Header sub-line: "42 brands · ₹18.4L". Summing only what is on screen would
 * misreport the catalogue when there is more behind "See all", so it says
 * "top N" in that case.
 */
export const prepareBrandMeta = (
  items: BrandValue[],
  total: number,
  loading: boolean,
) => {
  if (loading) return "Loading…";
  if (total > items.length) return `${total} brands · top ${items.length}`;

  const shownValue = items.reduce((sum, item) => sum + (item.value || 0), 0);
  const label = total === 1 ? "brand" : "brands";
  return `${total} ${label} · ${CommonService.formatCompact(shownValue)}`;
};

/**
 * Top brands by stock value, off the same `inventory-value-by-brand` feed the
 * Brand tab reads — so the block and the tab it opens can never disagree.
 *
 * Never throws: the block is a shortcut, not the page, so a failed feed renders
 * empty rather than taking the dashboard down.
 */
export const getBrandBreakdown = async (
  count: number,
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<BrandValue[]> => {
  try {
    const response = await InventoryDashboardService.getInventoryValueByBrand(
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
    console.error("Error fetching brand breakdown:", error);
    return [];
  }
};

/** How many brands exist in total — the "42 brands" in the header. */
export const getBrandCount = async (
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<number> => {
  try {
    const response = await InventoryDashboardService.getInventoryValueByBrand(
      { matchFilter: {}, ...params, outputType: "count" },
      { signal },
    );
    return Number(response?.data?.data?.total || 0);
  } catch (error) {
    console.error("Error fetching brand count:", error);
    return 0;
  }
};
