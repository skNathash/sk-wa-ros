import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";

/** Same base slice of the deal library the subscribe/search page works on. */
export const BASE_DEAL_FILTER = {
  status: "Active",
  isLocalDeal: false,
  "applicableBrand.brandName": { $ne: "" },
};

/**
 * Deals the shops around you already run that you haven't subscribed to.
 *
 * This runs on `catalog/seller-deals/price-comparison`, the same call behind
 * the subscribe/search "top" tab — the deals endpoint only takes the radius as
 * a *sort* hint, so a count off it comes back unscoped (the whole library).
 * Here `distance` is a real filter and `isSubscribed: false` keeps it to SKUs
 * this seller can still adopt.
 */
export const preparePeerSignalParams = (radiusKms: number) => ({
  view: "network",
  outputType: "list",
  distance: radiusKms,
  isSubscribed: false,
});

/**
 * Everything live in the master catalog, subscribed or not.
 *
 * `groupGroupedDeals` matches the subscribe/search list, which collapses a
 * deal's grouped variants into one row — without it the count reads higher
 * than the list the seller lands on from here.
 */
export const prepareLibraryParams = () => ({
  filter: { ...BASE_DEAL_FILTER },
  groupGroupedDeals: true,
});

/** Deals added to the library within the last `days` days. */
export const prepareNewDealParams = (days: number) => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  return {
    filter: {
      ...BASE_DEAL_FILTER,
      createdAt: { $gte: since.toISOString() },
    },
    groupGroupedDeals: true,
  };
};

/**
 * The peer signal in one call: the price comparison carries its row count on
 * the same response (`pagination.total`), so the hero's number and the sample
 * names it quotes always come from the same generation of data.
 */
const fetchPeerSignal = async (radiusKms: number) => {
  try {
    const response = await SellerCatalogService.getPriceComparison({
      ...preparePeerSignalParams(radiusKms),
      page: 1,
      limit: 3,
    });
    const body: any = response?.data || {};
    const rows: any[] = body.data || [];

    return {
      count: Number(body.pagination?.total) || 0,
      samples: rows.slice(0, 3).map((deal) => ({
        id: deal._id || deal.dealId || "",
        name: deal.dealName || deal.name || "",
        sellersCount: Number(deal.sellersCount) || 0,
      })),
    };
  } catch (error) {
    return { count: 0, samples: [] as CatalogSignalSample[] };
  }
};

const dealCount = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getDealsCount(params);
    return response?.data?.data?.totalDeals || 0;
  } catch (error) {
    return 0;
  }
};

/** Grouped counts (brand / category) come back as `totalGroups`, not `totalDeals`. */
const groupCount = async (
  fetcher: (params: any) => Promise<any>,
  params: Record<string, any>,
) => {
  try {
    const response = await fetcher(params);
    return response?.data?.data?.totalGroups || 0;
  } catch (error) {
    return 0;
  }
};

export interface CatalogSignalSample {
  id: string;
  name: string;
  /** Shops within the radius already stocking this SKU. */
  sellersCount: number;
}

export interface CatalogSignalStatsData {
  /** SKUs running near you that you haven't subscribed to. */
  peerGapCount: number;
  /** A few of those SKUs, to name them in the hero copy. */
  peerSamples: CatalogSignalSample[];
  /** Shops in the radius behind the most-stocked sample — 0 when unknown. */
  peerRetailers: number;
  librarySkus: number;
  libraryCategories: number;
  libraryBrands: number;
  subscribed: number;
  newDeals: number;
  /** False when every number came back zero — the strip has nothing to say. */
  hasData: boolean;
}

export const emptyStats: CatalogSignalStatsData = {
  peerGapCount: 0,
  peerSamples: [],
  peerRetailers: 0,
  librarySkus: 0,
  libraryCategories: 0,
  libraryBrands: 0,
  subscribed: 0,
  newDeals: 0,
  hasData: false,
};

export const fetchCatalogSignalStats = async (
  radiusKms: number,
  newWithinDays: number,
): Promise<CatalogSignalStatsData> => {
  const libraryParams = prepareLibraryParams();

  const [
    peerSignal,
    librarySkus,
    libraryCategories,
    libraryBrands,
    subscribed,
    newDeals,
  ] = await Promise.all([
    fetchPeerSignal(radiusKms),
    dealCount(libraryParams),
    groupCount(
      (p) => InventorySubscribeService.getCategoriesCount(p),
      libraryParams,
    ),
    groupCount(
      (p) => InventorySubscribeService.getBrandsCount(p),
      libraryParams,
    ),
    // The deals API flips the same param the search page uses for the
    // not-yet-subscribed slice. If the backend doesn't honour it we'd get the
    // whole library back, so anything >= the library total is discarded in
    // favour of the locally tracked subscription tally.
    dealCount({ ...libraryParams, dealSubscribeType: "SUBSCRIBED" }),
    dealCount(prepareNewDealParams(newWithinDays)),
  ]);

  const localSubscribed =
    AuthService.getLoggedInUser()?.analytics?.totalSubscribedDeals || 0;

  const resolvedSubscribed =
    subscribed > 0 && (librarySkus === 0 || subscribed < librarySkus)
      ? subscribed
      : localSubscribed;

  return {
    peerGapCount: peerSignal.count,
    peerSamples: peerSignal.samples,
    peerRetailers: peerSignal.samples.reduce(
      (max, s) => Math.max(max, s.sellersCount),
      0,
    ),
    librarySkus,
    libraryCategories,
    libraryBrands,
    subscribed: resolvedSubscribed,
    newDeals,
    hasData: Boolean(
      peerSignal.count ||
        librarySkus ||
        libraryCategories ||
        libraryBrands ||
        resolvedSubscribed ||
        newDeals,
    ),
  };
};

/** `1,00,240` — Indian digit grouping, matching the rest of the app's numbers. */
export const formatCount = (value: number) =>
  (value || 0).toLocaleString("en-IN");

/** Share of the library that's subscribed, as a whole number. */
export const formatSharePercent = (part: number, total: number) => {
  if (!total) return "";
  const pct = (part / total) * 100;
  if (pct === 0) return "0%";
  if (pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
};
