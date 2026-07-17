import CommonService from "~/services/CommonService";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { PaginationState } from "~/types/CommonTypes";
import type { SortValue } from "./components/SortPopover";

export const getData = async (params: Record<string, any>) => {
  try {
    const response =
      await InventoryDashboardService.getBottomDeadStockProducts(params);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching dead stock products:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response =
      await InventoryDashboardService.getBottomDeadStockProducts({
        ...params,
        outputType: "count",
      });
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching dead stock products count:", error);
    return 0;
  }
};

export const downloadExport = async (params: Record<string, any>) => {
  const response = await InventoryDashboardService.getBottomDeadStockProducts({
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
    params.matchFilter["dealInfo.dealName"] = {
      ...params.matchFilter["dealInfo.dealName"],
      ...CommonService.prepareAlphaRegexFilter(search.trim()),
    };
  }

  if (alpha) {
    params.matchFilter["dealInfo.dealName"] = {
      ...params.matchFilter["dealInfo.dealName"],
      ...CommonService.prepareAlphaRegexFilter(alpha),
    };
  }

  if (menu?.value?.id) {
    params.matchFilter["dealInfo.applicableMenu.menuId"] = menu.value.id;
  }

  if (category?.value?.id) {
    params.matchFilter["dealInfo.applicableCategory.categoryId"] =
      category.value.id;
  }

  if (category?.value?.parentId) {
    params.matchFilter["dealInfo.applicableParentCategory.categoryId"] =
      category.value.parentId;
  }

  if (brand?.value?.id) {
    params.matchFilter["dealInfo.applicableBrand.brandId"] = brand.value.id;
  }

  return params;
};
