import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export interface ReorderMetrics {
  skuCount: number;
  stockoutValue: number;
  saveThisWeek: number;
  slowCash: number;
}

export interface ReorderFilter {
  search?: string;
}

const SORT_MAP: Record<string, Record<string, number>> = {
  urgency: { velocity: -1, quantity: 1 },
  "fast-movers": { velocity: -1 },
  "oos-first": { quantity: 1 },
  sk: { "sellers.networkType": -1 },
  peer: { "sellers.networkType": 1 },
};

/**
 * Build the request params for the network reorder endpoint.
 */
export const prepareParams = (
  filter: ReorderFilter,
  pagination: PaginationState,
  sort?: string,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  if (sort && SORT_MAP[sort]) {
    params.sort = SORT_MAP[sort];
  }

  return SellerCatalogService.getNetworkReorderParams(params);
};

/**
 * Fetch a page of reorder recommendations from the network catalog.
 */
export const getData = async (
  params: Record<string, any>,
  distance: number | string = DEFAULT_BROWSE_DISTANCE,
) => {
  try {
    const response = await SellerCatalogService.getNetworkDeals(
      params,
      distance,
    );
    return SellerCatalogService.formatProductResponse(
      response.data?.data || [],
    );
  } catch (error) {
    console.error("Error fetching reorder data:", error);
    return [];
  }
};

/**
 * Fetch the total count of reorder recommendations.
 */
export const getCount = async (
  params: Record<string, any>,
  distance: number | string = DEFAULT_BROWSE_DISTANCE,
) => {
  try {
    const response = await SellerCatalogService.getNetworkDeals(
      { ...params, outputType: "count" },
      distance,
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching reorder count:", error);
    return 0;
  }
};

/**
 * Compute the top-level metrics from the currently loaded reorder items.
 */
export const getMetrics = (items: any[] = []): ReorderMetrics => {
  let stockoutValue = 0;
  let saveThisWeek = 0;
  let slowCash = 0;

  items.forEach((item) => {
    const price = Number(item.price) || 0;
    const mrp = Number(item.mrp) || 0;
    const stock = Number(item.totalStock) || 0;
    const velocity = Number(item.velocity) || 0;

    if (stock === 0) {
      stockoutValue += price * velocity;
    }

    saveThisWeek += Math.max(0, mrp - price) * velocity;
    slowCash += price * stock;
  });

  return {
    skuCount: items.length,
    stockoutValue,
    saveThisWeek,
    slowCash,
  };
};
