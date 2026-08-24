import SellerCatalogService from "~/services/SellerCatalogService";

/**
 * Best-priced active deals this seller offers the logged-in retailer.
 * Same seller-deals listing the Catalog tab reads, scoped to the seller and
 * sorted by the deepest discount, so the rows are the sharpest rates on offer.
 */
export const getData = async (sellerId: string, limit = 3) => {
  try {
    const params = {
      ...SellerCatalogService.getBaseParamsToBuyProduct(),
      page: 1,
      count: limit,
      sellerId,
      sort: "discount-desc",
      filter: { status: "Active", isLocalDeal: false },
    };
    const response = await SellerCatalogService.getProducts(params);
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data, {
      view: "buyer",
      sellerId,
    });
  } catch (error) {
    console.error("Error fetching exclusive prices:", error);
    return [];
  }
};

/**
 * A deal counts as "exclusive" when the seller has put a running scheme
 * (offer of the day) or a promotional rate on it — i.e. the price is better
 * than the standing network price rather than just being a cheap SKU.
 */
export const isExclusiveDeal = (deal: any): boolean =>
  deal?.b2bScheme?.status === "Running" || !!deal?.isPromotionalDeal;

/** Sellable stock on the row; falls back to the raw deal quantity. */
export const getStock = (deal: any): number =>
  Math.round(Number(deal?.maxQty ?? deal?.totalStock ?? 0) || 0);

/** Minimum order quantity the seller enforces for the deal. */
export const getMoq = (deal: any): number =>
  Math.round(Number(deal?.minQty) || 0);

/** Tile colours for the SKU thumb — stable per deal name, not per position. */
const TILE_COLORS = [
  "tw:bg-rose-500",
  "tw:bg-emerald-600",
  "tw:bg-blue-500",
  "tw:bg-amber-500",
  "tw:bg-violet-500",
  "tw:bg-teal-600",
  "tw:bg-sky-500",
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
