import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import type { PaginationState } from "~/types/CommonTypes";

export interface FetchParams {
  page?: number;
  count?: number;
  filter?: Record<string, any>;
  sort?: Record<string, any>;
}

export function prepareParams(
  filter: Record<string, any>,
  pagination: PaginationState,
) {
  const page = pagination.activePage;
  const count = pagination.rowsPerPage;

  const params: any = {
    page,
    limit: count,
    filter: {
      "analytics.totalSubscribedInStockDeals": { $gt: 0 },
    },
  };

  // Only sellers offering paylater to the buyer (chip toggle)
  if (filter.hasPaylater) {
    params.hasPaylater = true;
  }

  // Only SK sellers (chip toggle)
  if (filter.skSeller) {
    params.filter.networkType = "SKSELLER";
  }

  // Connected split — the API resolves the buyer's links. `true` returns only
  // connected sellers, `false` only the rest, so the two panes never overlap.
  if (filter.connected != null) {
    params.isConnected = Boolean(filter.connected);
  }

  // Set distance if provided
  if (filter.distance != null) {
    // If caller passed "all", map it to a very large distance string
    if (filter.distance === "all") {
      params.distance = "100000000";
      params.excludeByDeliveryRadius = false;
    } else {
      const distanceNum = Number(filter.distance);
      if (!Number.isNaN(distanceNum)) {
        params.distance = distanceNum;
      }
      params.excludeByDeliveryRadius = true;
    }
  }

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        franchiseId: search,
      },
      {
        mobile: search,
      },
    ];
  }

  // Alpha strip — first-letter filter on the seller name ("123" = digits).
  if (filter.alpha) {
    params.filter.name = CommonService.prepareAlphaRegexFilter(filter.alpha);
  }

  if (filter.sort) {
    const { key, value } = filter.sort;
    params.sort = { [key]: value === "asc" ? 1 : -1 };
  } else if (filter.sortPreset === "topSellers") {
    // "Top seller" chip — same ordering as the Discover Sellers page.
    params.sort = FranchiseService.getTopSellersSort();
  }

  return params;
}

export async function getData(params: FetchParams = {}) {
  const res = await FranchiseService.getRetailersNearby(params);

  return res?.data?.data || [];
}

export async function getCount(params: FetchParams = {}) {
  const res = await FranchiseService.getRetailersNearby({
    ...params,
    outputType: "count",
  });
  return res?.data?.data || 0;
}

export default {
  prepareParams,
  getData,
  getCount,
};
