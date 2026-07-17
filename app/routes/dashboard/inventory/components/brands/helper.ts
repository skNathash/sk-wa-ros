import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import CommonService from "~/services/CommonService";

export const prepareParams = (
  filter: {
    search?: string;
    alpha?: string;
  } = {},
  pagination: PaginationState
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {},
    sort: {
      "_id.brandName": 1,
    },
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

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getBrands(params);
    return {
      data: SellerCatalogService.formatBrandResponse(response.data?.data || []),
    };
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };
  delete p.page;
  delete p.count;
  try {
    const response = await SellerCatalogService.getBrands({
      ...p,
      outputType: "count",
    });
    return response.data?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
