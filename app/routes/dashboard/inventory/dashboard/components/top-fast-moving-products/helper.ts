import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventoryDashboardService.getTopFastMovingProducts(
      params,
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching fast moving products:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await InventoryDashboardService.getTopFastMovingProducts({
      ...params,
      outputType: "count",
    });
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching fast moving products count:", error);
    return 0;
  }
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    matchFilter: {},
  };

  const { search, alpha, menu, category, brand } = filter || {};

  if (search?.trim()) {
    params.matchFilter.$or = [
      { dealName: { $regex: search.trim(), $options: "i" } },
      { dealRefId: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (alpha) {
    if (alpha === "123") {
      params.matchFilter.dealName = {
        ...params.matchFilter.dealName,
        $regex: `^[0-9]`,
        $options: "i",
      };
    } else {
      params.matchFilter.dealName = {
        ...params.matchFilter.dealName,
        $regex: `^${alpha}`,
        $options: "i",
      };
    }
  }

  if (category?.value?.id) {
    params.matchFilter["dealInfo.applicableCategory.categoryId"] =
      category.value.id;
  }

  if (brand?.value?.id) {
    params.matchFilter["dealInfo.applicableBrand.brandId"] = brand.value.id;
  }

  if (category?.value?.parentId) {
    params.matchFilter["dealInfo.applicableParentCategory.categoryId"] =
      category.value.parentId;
  }

  if (menu?.value?.id) {
    params.matchFilter["dealInfo.applicableMenu.menuId"] = menu.value.id;
  }

  return params;
};
