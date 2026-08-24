import SellerCatalogService from "~/services/SellerCatalogService";
import { getData as getRewards } from "~/shared/coins/components/coin-store-pane/helper";
import type { PaginationState } from "~/types/CommonTypes";

export async function getData(params: Record<string, any>) {
  const r = await SellerCatalogService.getKcStoreDeals(params);
  return Array.isArray(r.data?.data) ? r.data.data : [];
}

export async function getCount(params: Record<string, any>) {
  const r = await SellerCatalogService.getKcStoreDeals({
    ...params,
    outputType: "count",
  });
  return r.data?.data?.count || 0;
}

/** The three numbers the theme-2 masthead states about the shelf. */
export interface CoinStoreBannerSummary {
  /** Rewards in the catalogue — the true total, not the loaded page. */
  total: number;
  /** Cheapest reward — the nearest redemption a new holder can reach. */
  minCoins: number;
  /** Costliest reward — the one worth saving up for. */
  maxCoins: number;
}

export const EMPTY_BANNER_SUMMARY: CoinStoreBannerSummary = {
  total: 0,
  minCoins: 0,
  maxCoins: 0,
};

/**
 * What the masthead says the shelf is worth right now. The endpoint carries no
 * redemption history, so the banner states the two ends of the coin range it
 * does carry — read off one catalogue page, with the count call for the total
 * so a page window never understates the shelf.
 */
export async function getBannerSummary(): Promise<CoinStoreBannerSummary> {
  const [total, rewards] = await Promise.all([
    getCount({ page: 1, limit: 1 }),
    getRewards(100),
  ]);

  const coins = rewards.map((r) => r.coins).filter((c) => c > 0);

  return {
    total: total || rewards.length,
    minCoins: coins.length ? Math.min(...coins) : 0,
    maxCoins: coins.length ? Math.max(...coins) : 0,
  };
}

export function prepareParams(
  filter: Record<string, any>,
  pagination: PaginationState,
) {
  let p = {
    page: pagination.activePage,
    limit: pagination.endSlNo,
  };

  return p;
}
