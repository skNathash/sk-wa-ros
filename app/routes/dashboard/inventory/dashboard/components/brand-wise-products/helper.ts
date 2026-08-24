import CommonService from "~/services/CommonService";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { PaginationState } from "~/types/CommonTypes";
import type { SortValue } from "~/components/feature/utility/sort/SortPopover";

export const getData = async (params: Record<string, any>) => {
  try {
    const response =
      await InventoryDashboardService.getInventoryValueByBrand(params);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching brand wise products:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await InventoryDashboardService.getInventoryValueByBrand({
      ...params,
      outputType: "count",
    });
    return response.data?.data?.total || 0;
  } catch (error) {
    console.error("Error fetching brand wise products count:", error);
    return 0;
  }
};

export const downloadExport = async (params: Record<string, any>) => {
  const response = await InventoryDashboardService.getInventoryValueByBrand({
    ...params,
    outputType: "download",
  });
  return response.data?.data || null;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: SortValue,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    matchFilter: {},
    sort: sort ? { [sort.key]: sort.value } : {},
  };

  const { search, alpha } = filter || {};

  if (search?.trim()) {
    const term = search.trim();
    params.matchFilter.$or = [
      { "applicableBrand.brandName": { $regex: term, $options: "i" } },
      { "applicableBrand.brandRefId": { $regex: term, $options: "i" } },
    ];
  }

  if (alpha) {
    params.matchFilter["applicableBrand.brandName"] =
      CommonService.prepareAlphaRegexFilter(alpha);
  }

  return params;
};
