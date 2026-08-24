import SellerCatalogService from "~/services/SellerCatalogService";
import { isLooseStockUom } from "../../helper";

/** Where "Full analytics" lands — this very dashboard, on the fast-moving view. */
export const WHATS_SELLING_PATH = "/dashboard/inventory/dashboard";

export const WHATS_SELLING_QUERY = { tab: "products", view: "fast_moving" };

/** The one window this block reads — everything on a tile is last-7-days. */
const WINDOW_KEY = "last7Days";

/** The window behind it, used only to work out which way a tile is trending. */
const PRIOR_KEY = "last15Days";

export interface SellingDeal {
  dealId: string;
  dealRefId?: string;
  dealName: string;
  brandName?: string;
  applicableBrand?: { brandId?: string; brandName?: string };
  categoryName?: string;
  selectedStockUom?: string;
  salesAnalytics?: Record<string, { quantity?: number; value?: number }>;
}

const num = (value: any) => Number(value) || 0;

/**
 * Deals that actually sold in the last 7 days, biggest sellers first.
 *
 * Ranked on `salesAnalytics.last7Days.quantity` server-side and filtered to the
 * same field so nothing with a flat week takes up a tile.
 *
 * Never throws: the block is a shortcut, not the page, so a failed feed renders
 * empty rather than taking the dashboard down.
 */
export const getSellingDeals = async (
  count: number,
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<SellingDeal[]> => {
  try {
    const response = await SellerCatalogService.getProducts(
      {
        page: 1,
        count,
        filter: {
          [`salesAnalytics.${WINDOW_KEY}.quantity`]: { $gt: 0 },
        },
        sort: { [`salesAnalytics.${WINDOW_KEY}.quantity`]: -1 },
        ...params,
      },
      { showOutOfStock: true },
      { signal },
    );
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching what's selling:", error);
    return [];
  }
};

/** Units sold in the last 7 days — the "84 units sold" line. */
export const getUnitsSold = (deal: SellingDeal) =>
  num(deal.salesAnalytics?.[WINDOW_KEY]?.quantity);

/** Value sold in the last 7 days — the big number on the tile. */
export const getValueSold = (deal: SellingDeal) =>
  num(deal.salesAnalytics?.[WINDOW_KEY]?.value);

/**
 * Which way the tile is trending, in percent.
 *
 * The API's windows are cumulative (`last15Days` contains the last 7), so the
 * previous period is the difference between them — 8 days' worth. Both sides are
 * reduced to units-per-day before comparing, otherwise the shorter current
 * window would always look like a fall.
 */
export const getTrendPct = (deal: SellingDeal): number => {
  const analytics = deal.salesAnalytics || {};
  const current = num(analytics[WINDOW_KEY]?.quantity) / 7;
  const prior =
    Math.max(
      num(analytics[PRIOR_KEY]?.quantity) -
        num(analytics[WINDOW_KEY]?.quantity),
      0,
    ) / 8;

  if (!prior) return current ? 100 : 0;
  return Math.round(((current - prior) / prior) * 100);
};

/** Growth steep enough to earn the "HOT" flag. */
export const HOT_TREND_PCT = 10;

export const isHot = (deal: SellingDeal) => getTrendPct(deal) >= HOT_TREND_PCT;

/**
 * Tile palette — a tinted card, its border and the text the name and value are
 * painted in. Picked by name hash so a deal keeps its colour between loads.
 */
export const TILE_COLORS = [
  {
    card: "tw:bg-amber-50 tw:border-amber-200",
    text: "tw:text-amber-600",
    badge: "tw:bg-white tw:text-amber-500",
  },
  {
    card: "tw:bg-blue-50 tw:border-blue-200",
    text: "tw:text-blue-600",
    badge: "tw:bg-white tw:text-blue-500",
  },
  {
    card: "tw:bg-rose-50 tw:border-rose-200",
    text: "tw:text-rose-600",
    badge: "tw:bg-white tw:text-rose-500",
  },
  {
    card: "tw:bg-emerald-50 tw:border-emerald-200",
    text: "tw:text-emerald-600",
    badge: "tw:bg-white tw:text-emerald-500",
  },
  {
    card: "tw:bg-violet-50 tw:border-violet-200",
    text: "tw:text-violet-600",
    badge: "tw:bg-white tw:text-violet-500",
  },
  {
    card: "tw:bg-orange-50 tw:border-orange-200",
    text: "tw:text-orange-600",
    badge: "tw:bg-white tw:text-orange-500",
  },
] as const;

export const getTileColor = (name: string) => {
  const seed = (name || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return TILE_COLORS[seed % TILE_COLORS.length];
};

/** The monogram square — first word of the name, clipped so it fits. */
export const getTileLabel = (name: string) =>
  (name || "?").trim().split(/\s+/)[0].slice(0, 5).toUpperCase();

/** Brand leads the tile; the deal name stands in when the brand is missing. */
export const getTileName = (deal: SellingDeal) =>
  deal.brandName || deal.applicableBrand?.brandName || deal.dealName || "—";

/** A feed row with everything a tile renders already worked out. */
export interface SellingTile extends SellingDeal {
  _key: string;
  _name: string;
  _label: string;
  _color: (typeof TILE_COLORS)[number];
  _unitsSold: number;
  _valueSold: number;
  _isLooseQty: boolean;
  _isHot: boolean;
  _trendUp: boolean;
  /** Already absolute — the arrow beside it carries the direction. */
  _trendPct: number;
}

/**
 * Turn the raw deal feed into tiles the grid can render straight out — name,
 * monogram, palette, the two sold figures and the trend split into direction
 * and magnitude.
 *
 * Done once here rather than per-tile in the JSX, where the name and the trend
 * were each being recomputed several times over.
 */
export const prepareSellingTiles = (deals: SellingDeal[]): SellingTile[] =>
  deals.map((deal, index) => {
    const name = getTileName(deal);
    const trend = getTrendPct(deal);

    return {
      ...deal,
      _key: String(deal.dealId || index),
      _name: name,
      _label: getTileLabel(name),
      _color: getTileColor(name),
      _unitsSold: getUnitsSold(deal),
      _valueSold: getValueSold(deal),
      _isLooseQty: isLooseStockUom(deal.selectedStockUom),
      _isHot: trend >= HOT_TREND_PCT,
      _trendUp: trend >= 0,
      _trendPct: Math.abs(trend),
    };
  });
