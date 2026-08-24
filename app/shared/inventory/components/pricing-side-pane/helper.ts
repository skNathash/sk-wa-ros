/** Shared types, styling and formatters for the Prices & Tax pane. */

import SellerCatalogService from "~/services/SellerCatalogService";
import type { PriceAlertPriceType } from "./price-alerts/helper";

/** The filters the pane's chip strip can put on the pricing list. */
export type PricingFilterKey = "all" | "unpriced" | "low-margin";

/** Counts behind each chip — omit a key to render its chip without a badge. */
export type PricingFilterCounts = Partial<Record<PricingFilterKey, number>>;

/** One row in the "B2B customer groups" list. */
export interface B2BCustomerGroup {
  id: string;
  name: string;
  /** Supporting line — who the group is and the terms it buys on. */
  description?: string;
  /** How many buyers sit in the group. */
  count?: number;
}

/** Seller-group-price-config document -> the row shape this list renders. */
export const mapGroupResponse = (group: any): B2BCustomerGroup => ({
  id: group?._id || group?.id || "",
  name: group?.name || "",
  description: group?.description || "",
  count: Array.isArray(group?.sellersInfo) ? group.sellersInfo.length : 0,
});

/** Peer radius (km) the comparison figures are computed against. */
export const PRICE_COMPARISON_DISTANCE = 15;

/**
 * Catalogue-wide pricing gaps behind the pane header and its chip badges.
 */
export interface PricingPaneSummary {
  /** Deals in the catalogue for the channel being priced. */
  skuCount: number;
  /** How many of them carry no price yet. */
  unpricedCount: number;
  /** How many sell on a margin thin enough to be worth revising. */
  lowMarginCount: number;
}

/** Scope the gap counts are taken over — the channel, and the online slice. */
export interface PricingScope {
  /** Channel the gaps are judged on: `b2b` / `b2c`. Defaults to B2B. */
  priceType?: PriceAlertPriceType;
  /**
   * Electronics: only SKUs carrying an online listing are in scope, so the
   * counts match what that sheet actually lists.
   */
  onlinePriceExist?: boolean;
}

/**
 * One `outputType=count` query on the price-comparison endpoint. `type` is the
 * gap being counted (`defaultToMrp` = unpriced, `lowMargin`); omit it for the
 * scope's total.
 */
const countDeals = async (
  { priceType = "b2b", onlinePriceExist }: PricingScope,
  type?: string,
) => {
  const response = await SellerCatalogService.getPriceComparison({
    distance: PRICE_COMPARISON_DISTANCE,
    priceType,
    filter: {},
    ...(onlinePriceExist ? { onlinePriceExist: true } : {}),
    ...(type ? { type } : {}),
    outputType: "count",
  });

  return response?.data?.count || 0;
};

/**
 * The pane's own numbers — the badges on its gap chips, counted the same way
 * the chips filter: one `outputType=count` per gap, scoped to the channel the
 * pane is on (`priceType`) and, on Electronics, to the online-listed slice.
 *
 * The pane reports the gaps across the whole channel, not the slice a page
 * happens to be listing, so it takes no filters from the caller.
 */
export const getPricingSummary = async (
  scopeOrPriceType: PricingScope | PriceAlertPriceType = "b2b",
): Promise<PricingPaneSummary | null> => {
  const scope: PricingScope =
    typeof scopeOrPriceType === "string"
      ? { priceType: scopeOrPriceType }
      : scopeOrPriceType;

  const [skuCount, unpricedCount, lowMarginCount] = await Promise.all([
    countDeals(scope),
    countDeals(scope, "defaultToMrp"),
    countDeals(scope, "lowMargin"),
  ]);

  return { skuCount, unpricedCount, lowMarginCount };
};

/** "14 SKUs · 3 unpriced" summary for the pane header. */
export const formatPricingSummary = (
  skuCount?: number,
  unpricedCount?: number,
): string | undefined => {
  if (skuCount === undefined) {
    return undefined;
  }

  const skus = `${skuCount} ${skuCount === 1 ? "SKU" : "SKUs"}`;
  return unpricedCount ? `${skus} · ${unpricedCount} unpriced` : skus;
};
