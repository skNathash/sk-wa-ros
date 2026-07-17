import VendorService from "~/services/VendorService";
import CommonService from "~/services/CommonService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareFilterParams = (
  filter: Record<string, any>,
  pagination: PaginationState
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { name: 1 },
    filter: {},
  };

  // search
  if (filter.search?.trim()) {
    const searchTerm = filter.search.trim();
    params.search = searchTerm;
  }

  // vendor type filter
  if (filter.vendorType && filter.vendorType !== "All") {
    params.filter.vendorType = filter.vendorType;
  }

  if (filter.alpha) {
    params.filter.name = "^" + filter.alpha;
    if (params.search) delete params.search;
  }

  // remove empty filter object
  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getCount = async (params: Record<string, any>) => {
  const response = await VendorService.getVendors({
    ...params,
    outputType: "count",
  });
  return response.data.count;
};

export const getData = async (params: Record<string, any>) => {
  const response = await VendorService.getVendors(params);
  return (response.data?.data || []).map((vendor: any) => ({
    ...vendor,
    initials: vendor.name.substring(0, 2).toUpperCase(),
  }));
};
