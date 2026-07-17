import SellerCatalogService from "~/services/SellerCatalogService";
import CommonService from "~/services/CommonService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: { search?: string; alpha?: string } = {},
  pagination: PaginationState,
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {},
    sort: { "_id.brandName": 1 },
  };

  const { search, alpha } = filter || {};

  if (search) {
    params.filter["applicableBrand.brandName"] = {
      $regex: search,
      $options: "i",
    };
  }

  if (alpha) {
    params.filter["applicableBrand.brandName"] =
      CommonService.prepareAlphaRegexFilter(alpha);
  }

  return params;
};

export const getData = async (
  params: Record<string, any>,
  distance: number,
) => {
  try {
    const response = await SellerCatalogService.getNetworkBrands({
      ...params,
      distance,
    });
    return SellerCatalogService.formatBrandResponse(response.data?.data || []);
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getCount = async (
  params: Record<string, any>,
  distance: number,
) => {
  const p = { ...params };
  delete p.page;
  delete p.count;
  try {
    const response = await SellerCatalogService.getNetworkBrands({
      ...p,
      outputType: "count",
      distance,
    });
    return response.data?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
