import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getBrands({
    ...params,
  });
  return SellerCatalogService.formatBrandResponse(
    response?.data?.data || [],
    true
  );
};

export const getCount = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getBrands({
    ...params,
    outputType: "count",
  });
  return response?.data?.count || 0;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps
) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      // "applicableBrand.id": filter.id,
    },
    sort: {
      "_id.brandName": 1,
    },
  };

  // search
  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  if (filter.alpha) {
    params.filter["applicableBrand.brandName"] =
      CommonService.prepareAlphaRegexFilter(filter.alpha);
  }

  return params;
};
