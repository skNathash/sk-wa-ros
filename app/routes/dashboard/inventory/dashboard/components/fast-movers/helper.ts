import InventoryDashboardService from "~/services/InventoryDashboardService";
import { isLooseStockUom, type FastMovingProduct } from "../../helper";

/** Where both mover blocks land — this very dashboard, on the products tab. */
export const MOVERS_PATH = "/dashboard/inventory/dashboard";

export const FAST_MOVERS_QUERY = { tab: "products", view: "fast_moving" };

export type MoverType = "FAST" | "SLOW";

/**
 * Top movers off the shared sku-movement list — the same feed the Fast Moving /
 * Slow Moving product tabs read, so the block and the tab it opens can never
 * disagree.
 *
 * Fast leads with the last 7 days' units (what is earning right now); slow
 * leads with the oldest sale, which floats the never-sold rows to the top.
 *
 * Never throws: the block is a shortcut, not the page, so a failed feed renders
 * empty rather than taking the dashboard down.
 */
export const getMovers = async (
  type: MoverType,
  count: number,
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<FastMovingProduct[]> => {
  try {
    const response = await InventoryDashboardService.getSkuMovementList(
      {
        page: 1,
        count,
        filter: {},
        matchFilter: { movement: type },
        sort:
          type === "FAST"
            ? { "salesAnalytics.last7Days.quantity": -1 }
            : { lastOrderDate: 1 },
        ...params,
      },
      { signal },
    );
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching movers:", error);
    return [];
  }
};

const num = (value: any) => Number(value) || 0;

/** Units sold in the last 7 days — the "/wk" figure. */
export const getWeeklyUnits = (product: FastMovingProduct): number =>
  num((product.salesAnalytics as any)?.last7Days?.quantity);

/** Solid brand-style square carrying the first word of the product name. */
export const AVATAR_COLORS = [
  "tw:bg-amber-400",
  "tw:bg-orange-500",
  "tw:bg-red-500",
  "tw:bg-emerald-500",
  "tw:bg-blue-500",
  "tw:bg-violet-500",
  "tw:bg-teal-500",
  "tw:bg-pink-500",
];

export const getAvatarColor = (name: string) => {
  const seed = (name || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
};

export const getAvatarLabel = (name: string) =>
  (name || "?").trim().split(/\s+/)[0].slice(0, 5).toUpperCase();

/**
 * Right-hand column of the strip. Stock value and days-of-cover are not on the
 * movement feed (it carries units, not landed cost), so the numbers are placeholders
 * until an endpoint serves them — everything to their left is live data.
 */
export interface FastMoverStat {
  value: number;
  cover: string;
  /** Cover thin enough to flag — the row shows a warning glyph. */
  urgent?: boolean;
}

export const FAST_MOVER_STATS: FastMoverStat[] = [
  { value: 756, cover: "4d cover", urgent: true },
  { value: 1080, cover: "3d cover", urgent: true },
  { value: 8344, cover: "3d cover", urgent: true },
  { value: 672, cover: "5d cover" },
  { value: 3960, cover: "4d cover", urgent: true },
  { value: 576, cover: "12d cover" },
];

export const getFastMoverStat = (index: number): FastMoverStat =>
  FAST_MOVER_STATS[index % FAST_MOVER_STATS.length];

/** A movement-feed row with everything the list renders already worked out. */
export interface FastMoverRow extends FastMovingProduct {
  _key: string;
  _avatarColor: string;
  _avatarLabel: string;
  _categoryLabel: string;
  _stockQty: number;
  _isLooseQty: boolean;
  _weeklyUnits: number;
  _statValue: number;
  _statCover: string;
  _statUrgent: boolean;
}

/**
 * Turn the raw movement feed into rows the list can render straight out —
 * avatar, stock, weekly units and the (placeholder) cover figures.
 *
 * Done once here rather than per-cell in the JSX so the row markup stays pure
 * markup.
 */
export const prepareFastMoverRows = (
  products: FastMovingProduct[],
): FastMoverRow[] =>
  products.map((product, index) => {
    const stat = getFastMoverStat(index);

    return {
      ...product,
      _key: String(product.dealId || index),
      _avatarColor: getAvatarColor(product.dealName),
      _avatarLabel: getAvatarLabel(product.dealName),
      _categoryLabel: product.categoryName || "—",
      _stockQty: product.availableQuantity ?? 0,
      _isLooseQty: isLooseStockUom(product.selectedStockUom),
      _weeklyUnits: getWeeklyUnits(product),
      _statValue: stat.value,
      _statCover: stat.cover,
      _statUrgent: Boolean(stat.urgent),
    };
  });
