import CommonService from "~/services/CommonService";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { PaginationState } from "~/types/CommonTypes";
import type { SortValue } from "~/components/feature/utility/sort/SortPopover";

export type InventoryRiskType = "reorderRequired" | "expiryRisk" | "reserve";

export const getData = async (
  type: InventoryRiskType,
  params: Record<string, any>,
) => {
  try {
    const response = await InventoryDashboardService.getInventoryRisk(
      type,
      params,
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error(`Error fetching ${type} products:`, error);
    return [];
  }
};

export const getCount = async (
  type: InventoryRiskType,
  params: Record<string, any>,
) => {
  try {
    const response = await InventoryDashboardService.getInventoryRisk(type, {
      ...params,
      outputType: "count",
    });
    return response.data?.count || 0;
  } catch (error) {
    console.error(`Error fetching ${type} products count:`, error);
    return 0;
  }
};

export const downloadExport = async (
  type: InventoryRiskType,
  params: Record<string, any>,
) => {
  const response = await InventoryDashboardService.getInventoryRisk(type, {
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

  const { search, alpha, menu, category, brand } = filter || {};

  if (search?.trim()) {
    const term = search.trim();
    params.matchFilter.$or = [
      { dealName: { $regex: term, $options: "i" } },
      { dealRefId: { $regex: term, $options: "i" } },
    ];
  }

  if (alpha) {
    params.matchFilter.dealName = {
      ...params.matchFilter.dealName,
      ...CommonService.prepareAlphaRegexFilter(alpha),
    };
  }

  if (category?.value?.id) {
    params.matchFilter["categoryRefId"] = category.value.id;
  }

  if (brand?.value?.id) {
    params.matchFilter["brandRefId"] = brand.value.id;
  }

  if (category?.value?.parentId) {
    params.matchFilter["parentCategoryRefId"] = category.value.parentId;
  }

  if (menu?.value?.id) {
    params.matchFilter["menuRefId"] = menu.value.id;
  }

  return params;
};
