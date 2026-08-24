import type { AxiosRequestConfig } from "axios";
import InventorySubscribeService from "~/services/InventorySubscribeService";

/** Number of products fetched for each discover rail. */
export const DISCOVER_RAIL_LIMIT = 12;

// Deep-linked "See all" targets for each rail, reusing the existing search page.
export const SEARCH_PATH = "/dashboard/inventory/subscribe/search";
export const TRENDING_SEE_ALL = `${SEARCH_PATH}?tab=search&sortType=popular&hideTab=false`;
export const JUST_LAUNCHED_SEE_ALL = `${SEARCH_PATH}?tab=search&sortType=newly-created&hideTab=false`;
/** Everything else — the unfiltered catalog, for the closing "see all" card. */
export const CATALOG_SEE_ALL = `${SEARCH_PATH}?tab=search`;
// Subscribe's dedicated browse pages — the full listing behind each browse tile.
const SUBSCRIBE_PATH = "/dashboard/inventory/subscribe";
export const CATEGORIES_SEE_ALL = `${SUBSCRIBE_PATH}/browse-category?tab=categories`;
export const BRANDS_SEE_ALL = `${SUBSCRIBE_PATH}/browse-brands?tab=brands`;

// Shared base filter for every rail — active, branded, non-local deals the seller
// has not already subscribed to (mirrors the search page's prepareParams).
const buildBaseParams = (limit = DISCOVER_RAIL_LIMIT) => ({
  page: 1,
  limit,
  filter: {
    status: "Active",
    "applicableBrand.brandName": { $ne: "" },
    isLocalDeal: false,
  } as Record<string, any>,
  dealSubscribeType: "NOTSUBSCRIBED",
  groupGroupedDeals: true,
});

const runDeals = async (params: Record<string, any>, signal?: AbortSignal) => {
  const config: AxiosRequestConfig | undefined = signal ? { signal } : undefined;
  const response = await InventorySubscribeService.getDeals(params, config);
  const deals = response?.data?.data || [];
  return InventorySubscribeService.formatDealResponse(deals);
};

/** Trending — the "top running" deals, ranked by popularity (the `top` API). */
export const fetchTrending = async (signal?: AbortSignal) => {
  const params = buildBaseParams();
  params.filter.topRunningDeal = true;
  return runDeals({ ...params, sort: { sortType: "popular" } }, signal);
};

/** Just launched — newest deals in the catalog (newly launched). */
export const fetchJustLaunched = async (signal?: AbortSignal) => {
  const params = buildBaseParams();
  return runDeals({ ...params, sort: { sortType: "newly-created" } }, signal);
};
