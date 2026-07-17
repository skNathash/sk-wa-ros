import CommonService from "~/services/CommonService";
import VendorService from "~/services/VendorService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const getData = async (
  vendorId: string,
  params: Record<string, any>
) => {
  const response = await VendorService.getBrands(vendorId, params);
  return response.data?.data || [];
};

export const getCount = async (
  vendorId: string,
  params: Record<string, any>
) => {
  const { page, limit, ...restParams } = params;

  const response = await VendorService.getBrands(vendorId, {
    restParams,
    outputType: "count",
  });
  return response.data?.count || 0;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState | null,
  sort: SortProps | null
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
    filter: {},
  };

  if (sort && sort.key) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (filter.search) {
    params.filter.brandName = filter.search;
  }

  if (filter.alpha) {
    params.filter.brandName = CommonService.prepareAlphaRegexFilter(
      filter.alpha
    );
  }

  return params;
};
