import SellerCatalogService from "~/services/SellerCatalogService";

export type TopSkuItem = {
  id: string;
  name: string;
  purchaseCount: number;
  buyPrice: number;
  mrp: number;
  growthPercentage: number;
};

export type TopSkusBoughtData = {
  items: TopSkuItem[];
};

/**
 * Fetch the deals this retailer has previously bought from the seller.
 * The endpoint returns the same shape as the seller-deals list, so the raw
 * products are run through `formatProductResponse` (buyer view) — the same
 * formatting the catalog/reorder listings use, which SellerAddToCart relies on.
 */
export const getData = async (sellerId: string) => {
  try {
    const response = await SellerCatalogService.getPurchasedDeals({ sellerId, limit: 50 });
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data, {
      view: "buyer",
      sellerId,
    });
  } catch (error) {
    console.error("Error fetching top SKUs bought:", error);
    return [];
  }
};

/**
 * Units bought per month. The purchased-deals payload carries the buy volume
 * on `purchaseInfo`; when it doesn't, fall back to the 90-day quantity the
 * catalog block always returns, averaged over the three months it covers.
 */
export const getMonthlyRate = (deal: any): number => {
  const raw = deal?._raw || {};
  const direct =
    raw.purchaseInfo?.monthlyQuantity ??
    raw.purchasedQuantity ??
    raw.purchaseCount;

  if (Number(direct) > 0) return Math.round(Number(direct));

  const last90 = Number(deal?.salesAnalytics?.last90Days?.quantity) || 0;
  return Math.round(last90 / 3);
};

type MovementMeta = { label: string; icon: string; className: string };

/** Movement chip (label + arrow + tone) for a deal's `movementType`. */
export const getMovementMeta = (movementType?: string): MovementMeta => {
  switch ((movementType || "").toLowerCase()) {
    case "fast moving":
      return {
        label: "Moving",
        icon: "▲",
        className: "tw:bg-emerald-50 tw:text-emerald-700",
      };
    case "slow moving":
      return {
        label: "Slow",
        icon: "▼",
        className: "tw:bg-amber-50 tw:text-amber-700",
      };
    case "non-moving":
      return {
        label: "Idle",
        icon: "▼",
        className: "tw:bg-rose-50 tw:text-rose-600",
      };
    default:
      return {
        label: "Steady",
        icon: "→",
        className: "tw:bg-slate-100 tw:text-slate-500",
      };
  }
};

/** Tile colours for the SKU thumb — stable per deal name, not per position. */
const TILE_COLORS = [
  "tw:bg-amber-500",
  "tw:bg-yellow-400",
  "tw:bg-rose-500",
  "tw:bg-green-500",
  "tw:bg-teal-600",
  "tw:bg-sky-500",
  "tw:bg-violet-500",
];

export const getTileColor = (name?: string) => {
  const key = (name || "").trim();
  if (!key) return TILE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i)) % TILE_COLORS.length;
  }
  return TILE_COLORS[hash];
};
