import VendorService from "~/services/VendorService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  const response = await VendorService.getVendors({
    ...params,
  });
  return response?.data?.data || [];
};

export const getCount = async (params: Record<string, any>) => {
  const response = await VendorService.getVendors({
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
      brandId: filter.brandId,
    },
    sort: {
      name: 1,
    },
  };

  // search
  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  return params;
};
