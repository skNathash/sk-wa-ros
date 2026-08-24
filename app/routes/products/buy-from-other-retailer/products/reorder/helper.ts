import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export {
  type ReorderItem,
  getFirstSeller,
  mapProductToReorderItem,
} from "~/shared/products/reorder-card/helper";

export interface FilterFormData {
  search: string;
}

export const defaultFilter: FilterFormData = {
  search: "",
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  // Remove filter if empty
  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return SellerCatalogService.getNetworkReorderParams(params);
};

const normalizeDistance = (distance?: number | string) => {
  if (distance === "all") return "all";
  if (distance == null) return undefined;
  return Number(distance);
};

export const getData = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    const response = await SellerCatalogService.getNetworkDeals(
      params,
      normalizeDistance(distance),
    );
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data);
  } catch (error) {
    console.error("Error fetching reorder products:", error);
    return [];
  }
};

export const getCount = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    const countParams = { ...params, outputType: "count" };
    const response = await SellerCatalogService.getNetworkDeals(
      countParams,
      normalizeDistance(distance),
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching reorder products count:", error);
    return 0;
  }
};
