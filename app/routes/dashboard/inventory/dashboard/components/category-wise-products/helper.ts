import CommonService from "~/services/CommonService";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { PaginationState } from "~/types/CommonTypes";
import type { SortValue } from "~/components/feature/utility/sort/SortPopover";

export const getData = async (params: Record<string, any>) => {
  try {
    const response =
      await InventoryDashboardService.getInventoryValueByCategory(params);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching category wise products:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response =
      await InventoryDashboardService.getInventoryValueByCategory({
        ...params,
        outputType: "count",
      });
    return response.data?.data?.total || 0;
  } catch (error) {
    console.error("Error fetching category wise products count:", error);
    return 0;
  }
};

export const downloadExport = async (params: Record<string, any>) => {
  const response = await InventoryDashboardService.getInventoryValueByCategory({
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
      { "applicableCategory.categoryName": { $regex: term, $options: "i" } },
      { "applicableCategory.categoryRefId": { $regex: term, $options: "i" } },
    ];
  }

  if (alpha) {
    params.matchFilter["applicableCategory.categoryName"] =
      CommonService.prepareAlphaRegexFilter(alpha);
  }

  return params;
};
