import { merge } from "lodash";
import FranchiseService from "~/services/FranchiseService";
import SellerCatalogService from "~/services/SellerCatalogService";

// Data access for the "Shop by seller" section: the busiest nearby sellers and
// the buyer's open cart value against each of them.

export type Seller = {
  _id: string;
  name: string;
  city?: string;
  town?: string;
  district?: string;
  shopImg?: string;
  distanceToFranchiseKm: number;
  ratingsSummary?: {
    avgRating: number;
    totalReviews: number;
  };
  analytics?: {
    totalOrders?: number;
  };
  paylaterInfo?: Record<string, any>;
  _initial?: string;
  _tintIndex?: number;
  _networkLbl?: string;
  _networkColor?: any;
  /** Open cart value with this seller, merged in from the multi-carts API. */
  totalCartValue?: number;
  /** Normalised by FranchiseService.formatSeller — 0 when the seller sets none. */
  minOrder?: number;
  orderCount?: number;
};

/** How many seller blocks the section shows. */
export const TOP_SELLERS_COUNT = 3;

// ETA is the one fulfilment data point the sellers API does not carry yet —
// placeholder values so the block reads complete. Varied by index so the list
// isn't uniform. MOQ comes from the response (`minOrder`).
export const ETA_PLACEHOLDERS = ["Same day", "Next day", "2h"];

/** Fetch the busiest nearby sellers (by last-30-day order volume). */
export async function getTopSellers(
  distance: string | number,
): Promise<Seller[]> {
  const isAll = distance === "all";
  const res = await FranchiseService.getRetailersNearby({
    page: 1,
    limit: TOP_SELLERS_COUNT,
    // "all" sellers regardless of delivery radius (see retailers/helper.ts).
    distance: isAll ? "100000000" : Number(distance),
    excludeByDeliveryRadius: !isAll,
    includePaylater: true,
    sort: FranchiseService.getTopSellersSort(),
    additionalInfo: true,
  });

  return res?.data?.data || [];
}

/**
 * Roll the multi-carts response into { sellerId: openCartValue }. The cart API
 * keys each cart by the seller's franchise id, which is what the sellers list
 * returns as `_id`.
 */
export async function getCartValueBySeller(): Promise<Record<string, number>> {
  const res = await SellerCatalogService.getMultiCarts({});
  const carts = res?.data?.data || [];

  return (carts || []).reduce((acc: Record<string, number>, cart: any) => {
    const sellerId = cart?.franchiseInfo?.id;
    if (!sellerId) return acc;

    const total = (cart.items || []).reduce(
      (sum: number, item: any) =>
        sum + (Number(item.purchasePrice) || 0) * (Number(item.quantity) || 0),
      0,
    );
    acc[sellerId] = (acc[sellerId] || 0) + total;
    return acc;
  }, {});
}

/** Sellers with their open cart value attached under `totalCartValue`. */
export async function getSellersWithCartValue(
  distance: string | number,
): Promise<Seller[]> {
  const [sellers, cartValues] = await Promise.all([
    getTopSellers(distance),
    getCartValueBySeller().catch(() => ({}) as Record<string, number>),
  ]);

  return sellers.map((seller) => ({
    ...seller,
    totalCartValue: cartValues[seller._id] || 0,
  }));
}

/**
 * Fetch one seller's catalog for the rail. Same seller-deals API and buyer-view
 * formatting the seller's catalog tab uses, so prices, schemes and add-to-cart
 * behave identically; each deal is tagged with `buyFromOtherRetailer` so the
 * card knows which shop it belongs to.
 */
export async function getSellerProducts(
  sellerId: string,
  count: number,
): Promise<any[]> {
  const params = merge({}, SellerCatalogService.getBaseParamsToBuyProduct(), {
    page: 1,
    count,
    sellerId,
    parent: true,
    filter: {
      isLocalDeal: false,
    },
  });

  const response = await SellerCatalogService.getProducts(params);
  const deals = SellerCatalogService.formatProductResponse(response.data.data, {
    view: "buyer",
    sellerId,
  });

  return (deals || []).map((deal: any) => ({
    ...deal,
    buyFromOtherRetailer: {
      status: true,
      retailerId: sellerId,
    },
  }));
}

export default {
  getTopSellers,
  getCartValueBySeller,
  getSellersWithCartValue,
  getSellerProducts,
};
