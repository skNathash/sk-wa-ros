import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: { search?: string },
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

  return params;
};

export const getData = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    let distanceParam: any = undefined;
    if (distance === "all") distanceParam = "all";
    else if (distance == null) distanceParam = undefined;
    else distanceParam = Number(distance);

    const response = await SellerCatalogService.getNetworkDeals(
      params,
      distanceParam,
    );
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data, {
      view: "buyer",
    });
  } catch (error) {
    console.error("Error fetching network deals:", error);
    return [];
  }
};

export const getCount = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    const countParams = { ...params, outputType: "count" };
    let distanceParam: any = undefined;
    if (distance === "all") distanceParam = "all";
    else if (distance == null) distanceParam = undefined;
    else distanceParam = Number(distance);

    const response = await SellerCatalogService.getNetworkDeals(
      countParams,
      distanceParam,
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching network deals count:", error);
    return 0;
  }
};
