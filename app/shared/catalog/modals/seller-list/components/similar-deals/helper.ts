import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState | { activePage?: number; rowsPerPage?: number },
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage ?? 1,
    count: pagination?.rowsPerPage ?? 20,
    filter: {},
  };

  if (filter?.categoryId) {
    params.filter["applicableCategory.categoryId"] = filter.categoryId;
  }

  if (filter?.brandId) {
    params.filter["applicableBrand.brandId"] = filter.brandId;
  }

  if (filter?.excludeDealId) {
    params.filter.dealId = { $ne: filter.excludeDealId };
  }

  return params;
};

export const getData = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    const distanceNum = distance == null ? undefined : Number(distance);
    const response = await SellerCatalogService.getNetworkDeals(
      params,
      distanceNum,
    );
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data);
  } catch (error) {
    console.error("Error fetching similar deals data:", error);
    return [];
  }
};

export const getCount = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    const countParams = { ...params, outputType: "count" };
    const distanceNum = distance == null ? undefined : Number(distance);
    const response = await SellerCatalogService.getNetworkDeals(
      countParams,
      distanceNum,
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching similar deals count:", error);
    return 0;
  }
};

export default {
  prepareParams,
  getData,
  getCount,
};
