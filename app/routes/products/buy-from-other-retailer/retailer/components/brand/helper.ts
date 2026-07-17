import SellerCatalogService from "~/services/SellerCatalogService";
import CommonService from "~/services/CommonService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getBrands(params);
    return {
      data: SellerCatalogService.formatBrandResponse(
        response?.data?.data || [],
        true,
      ).map((e) => ({ ...e, totalDeals: e._raw?.totalDeals || 0 })),
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
    return response?.data?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const prepareParams = (
  filter: { search?: string; alpha?: string; retailerId?: string } = {},
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {},
    sort: { "_id.brandName": 1 },
  };

  if (filter.retailerId) {
    params.sellerId = filter.retailerId;
  }

  if (filter.search) {
    params.filter.search = filter.search?.trim();
  }

  if (filter.alpha) {
    params.filter["applicableBrand.brandName"] =
      CommonService.prepareAlphaRegexFilter(filter.alpha);
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export default { getData, getCount, prepareParams };
