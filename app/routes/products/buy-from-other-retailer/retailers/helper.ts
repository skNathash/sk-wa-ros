import { startOfMonth } from "date-fns";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import PaylaterService from "~/services/PaylaterService";
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
    includePaylater: true,
    additionalInfo: true,
    filter: {
      "analytics.totalSubscribedInStockDeals": { $gt: 0 },
    },
  };

  // Only sellers offering paylater to the buyer (chip / Summary card toggle)
  if (filter.hasPaylater) {
    params.hasPaylater = true;
  }

  // Network-type chips (SK Seller / SK Retailer). Both on → either type, so the
  // two chips widen the list instead of cancelling each other out.
  const networkTypes = [
    filter.skSeller ? "SKSELLER" : null,
    filter.skRetailer ? "SKRETAILER" : null,
  ].filter(Boolean) as string[];

  if (networkTypes.length === 1) {
    params.filter.networkType = networkTypes[0];
  } else if (networkTypes.length > 1) {
    params.filter.networkType = { $in: networkTypes };
  }

  // Only connected sellers (chip toggle) — the API resolves the buyer's links.
  if (filter.connected) {
    params.isConnected = true;
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

  if (filter.alpha) {
    params.filter.name = {
      $regex: `^${filter.alpha}`,
      $options: "i",
    };
  }

  if (filter.sort) {
    const { key, value } = filter.sort;
    params.sort = { [key]: value === "asc" ? 1 : -1 };
  } else if (filter.sortPreset === "topSellers") {
    // Arrived from the "Top Sellers" rail's "See all" — keep the same ordering.
    params.sort = FranchiseService.getTopSellersSort();
  }

  return params;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  northEast: LatLng;
  southWest: LatLng;
}

// The map asks the same nearby-sellers endpoint for a viewport instead of a
// radius: `inputType=boundary` swaps the distance filter for the NE/SW corners
// the user last dragged into view. Everything else (search, alpha, chips) rides
// along so the map and the list agree on what "matching" means.
export function prepareMapParams(
  filter: Record<string, any>,
  bounds: MapBounds,
  center: LatLng,
  limit = 400,
) {
  const params = prepareParams(filter, {
    activePage: 1,
    rowsPerPage: limit,
  } as PaginationState);

  // Bounds already constrain the area — a radius on top of them would clip the
  // corners of the viewport.
  delete params.distance;
  delete params.excludeByDeliveryRadius;

  return {
    ...params,
    inputType: "boundary",
    bounds,
    latitude: center.lat,
    longitude: center.lng,
    page: 1,
    limit,
  };
}

export async function getMapData(
  filter: Record<string, any>,
  bounds: MapBounds,
  center: LatLng,
  limit = 400,
) {
  const res = await FranchiseService.getRetailersNearby(
    prepareMapParams(filter, bounds, center, limit),
  );
  return res?.data?.data || [];
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

// Total payables count (parties the retailer owes money to)
export async function getPayablesCount() {
  const res: any = await AccountService.getPayablesReceiveables({
    type: "payables",
    outputType: "count",
    filter: { "partyDetails.type": "franchise" },
  });
  return Number(res?.data?.data?.count ?? res?.data?.count) || 0;
}

// Total paylater enabled count for the logged-in user
export async function getPaylaterCount() {
  const userId = AuthService.getLoggedInUserId();
  if (!userId) return 0;

  const res: any = await PaylaterService.getRequestCount({
    page: 1,
    count: 500,
    filter: { "userInfo.id": userId },
  });
  return Number(res?.data?.data?.count ?? res?.data?.count) || 0;
}

// Sellers the buyer is already connected to, within the current radius — the
// same list query the page runs, narrowed with `isConnected` and asked for a
// count only.
export async function getConnectedCount(filter: Record<string, any> = {}) {
  const params = prepareParams(
    { ...filter, connected: true },
    { activePage: 1, rowsPerPage: 1 } as PaginationState,
  );
  return Number(await getCount(params)) || 0;
}

// Sellers that joined the network since the start of the current month.
export async function getNewThisMonthCount(filter: Record<string, any> = {}) {
  const params = prepareParams(filter, {
    activePage: 1,
    rowsPerPage: 1,
  } as PaginationState);

  return (
    Number(
      await getCount({
        ...params,
        filter: {
          ...params.filter,
          createdAt: { $gte: startOfMonth(new Date()).toISOString() },
        },
      }),
    ) || 0
  );
}

export async function getSummary(filter: Record<string, any> = {}) {
  try {
    const promises = [
      getPayablesCount(),
      getPaylaterCount(),
      getConnectedCount(filter),
      getNewThisMonthCount(filter),
    ];

    const [youOwe, paylaterAvail, connectedCount, newThisMonthCount] =
      await Promise.all(promises);

    return {
      youOwe: youOwe || 0,
      paylaterAvail: paylaterAvail || 0,
      connectedCount: connectedCount || 0,
      newThisMonthCount: newThisMonthCount || 0,
    };
  } catch (error) {
    console.error("Error fetching summary:", error);
    return {
      youOwe: 0,
      paylaterAvail: 0,
      connectedCount: 0,
      newThisMonthCount: 0,
    };
  }
}

export default {
  prepareParams,
  prepareMapParams,
  getMapData,
  getData,
  getCount,
  getPayablesCount,
  getPaylaterCount,
  getConnectedCount,
  getNewThisMonthCount,
  getSummary,
};
