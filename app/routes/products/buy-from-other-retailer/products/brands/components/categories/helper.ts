import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export type CategoryFilter = {
  brandId?: string;
  search?: string;
  distance?: number | string;
};

export const prepareParams = (
  filter: CategoryFilter,
  pagination: PaginationState,
): Record<string, any> => {
  const { brandId, search, distance = DEFAULT_BROWSE_DISTANCE } = filter || {};
  const trimmed = search?.trim();

  return {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      status: "Active",
      ...(trimmed ? { search: trimmed } : {}),
      ...(brandId ? { "applicableBrand.brandId": brandId } : {}),
    },
    sort: { "_id.categoryName": 1 },
    distance: Number(distance) || DEFAULT_BROWSE_DISTANCE,
  };
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getNetworkCategories(params);
    return SellerCatalogService.formatCategoryResponse(
      response.data?.data || [],
    );
  } catch (error) {
    console.error("Error fetching network categories:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  try {
    const response =
      await SellerCatalogService.getNetworkCategories(countParams);
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching network categories count:", error);
    return 0;
  }
};
