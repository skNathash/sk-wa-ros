import { tileDecor, type TileDecor } from "~/components/core/tint/tints";
import SellerCatalogService from "~/services/SellerCatalogService";

/** Radius (km) the retailer search is scoped to. */
export const DEFAULT_DISTANCE = 10000;

/** One seller row inside `GET catalog/deals/performance/{dealId}`. */
export interface DealSeller {
  sellerId?: string;
  sellerRefId?: string;
  sellerName?: string;
  b2cPrice?: number;
  b2bPrice?: number;
  distanceKm?: number;
  city?: string;
  soldPerWeek?: number;
}

/** A seller row with its avatar tint resolved once, off the response. */
export type Retailer = DealSeller & TileDecor;

export interface DealPerformance {
  /** Retailers stocking this deal within the requested radius. */
  retailers: Retailer[];
  /** Headline count the API reports for that radius. */
  count: number;
  /** Average selling price across those retailers. */
  avgSellerPrice: number;
}

const EMPTY: DealPerformance = { retailers: [], count: 0, avgSellerPrice: 0 };

/**
 * Retailers stocking this deal nearby. The API answers with the whole deal
 * document; only the `sellers` rail and its roll-ups are of interest here.
 */
export const getData = async (
  dealId: string,
  distance: number = DEFAULT_DISTANCE,
): Promise<DealPerformance> => {
  try {
    const response = await SellerCatalogService.getDealPerformance(dealId, {
      distance,
    });
    if (response.statusCode !== 200) return EMPTY;

    const data = response.data?.data || {};
    const sellers: DealSeller[] = data.sellers || [];

    return {
      retailers: sellers.map((seller) => ({
        ...seller,
        ...tileDecor(seller.sellerName),
      })),
      count: data.sellerCount || sellers.length,
      avgSellerPrice: data.avgSellerPrice || 0,
    };
  } catch (error) {
    console.error("Error fetching deal performance:", error);
    return EMPTY;
  }
};
