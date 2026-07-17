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

  if (filter.alpha) {
    params.filter.name = {
      $regex: `^${filter.alpha}`,
      $options: "i",
    };
  }

  if (filter.sort) {
    const { key, value } = filter.sort;
    params.sort = { [key]: value === "asc" ? 1 : -1 };
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
