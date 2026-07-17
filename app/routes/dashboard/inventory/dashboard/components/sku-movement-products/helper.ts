import InventoryDashboardService from "~/services/InventoryDashboardService";
import type { PaginationState } from "~/types/CommonTypes";
import type { SortValue } from "~/components/feature/utility/sort/SortPopover";

export type SkuMovementType = "FAST" | "SLOW" | "NON_MOVING";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventoryDashboardService.getSkuMovementList(params);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching sku movement products:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await InventoryDashboardService.getSkuMovementList({
      ...params,
      outputType: "count",
    });
    return response.data?.data?.total || 0;
  } catch (error) {
    console.error("Error fetching sku movement products count:", error);
    return 0;
  }
};

export const downloadExport = async (params: Record<string, any>) => {
  const response = await InventoryDashboardService.getSkuMovementList({
    ...params,
    outputType: "download",
  });
  return response.data?.data || null;
};

export const prepareParams = (
  type: SkuMovementType,
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: SortValue,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    matchFilter: { movement: type },
    filter: {},
    sort: sort ? { [sort.key]: sort.value } : {},
  };

  const { search, alpha, menu, category, brand } = filter || {};

  if (search?.trim()) {
    params.filter.$or = [
      { dealName: { $regex: search.trim(), $options: "i" } },
      { dealRefId: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (alpha) {
    if (alpha === "123") {
      params.filter.dealName = {
        ...params.filter.dealName,
        $regex: `^[0-9]`,
        $options: "i",
      };
    } else {
      params.filter.dealName = {
        ...params.filter.dealName,
        $regex: `^${alpha}`,
        $options: "i",
      };
    }
  }

  if (category?.value?.id) {
    params.filter["applicableCategory.categoryId"] = category.value.id;
  }

  if (brand?.value?.id) {
    params.filter["applicableBrand.brandId"] = brand.value.id;
  }

  if (category?.value?.parentId) {
    params.filter["applicableParentCategory.categoryId"] =
      category.value.parentId;
  }

  if (menu?.value?.id) {
    params.filter["applicableMenu.menuId"] = menu.value.id;
  }

  return params;
};
