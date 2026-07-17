import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export type FilterType = "brand" | "category";

export type FilterItem = {
  _id: string;
  name: string;
  _displayName?: string;
  dealsCount?: number;
};

/** Build a mongo-style id filter that supports single id or `$in` for many. */
const idFilter = (value?: string) => {
  if (!value) return undefined;
  const ids = String(value).split(",").filter(Boolean);
  if (ids.length === 0) return undefined;
  return ids.length > 1 ? { $in: ids } : ids[0];
};

export type FilterParams = {
  type: FilterType;
  search?: string;
  menuId?: string;
  /**
   * Comma-separated cross-filter scope ids. For the brand filter this is the
   * selected category id(s); for the category filter it is the brand id(s).
   */
  scopeId?: string;
  distance?: number | string;
};

export const prepareParams = (
  filter: FilterParams,
  pagination: PaginationState,
): Record<string, any> => {
  const { type, search, menuId, scopeId, distance = DEFAULT_BROWSE_DISTANCE } =
    filter;
  const trimmed = search?.trim();
  const scopeKey =
    type === "brand"
      ? "applicableCategory.categoryId"
      : "applicableBrand.brandId";
  const sort =
    type === "brand" ? { "_id.brandName": 1 } : { "_id.categoryName": 1 };
  const scope = idFilter(scopeId);

  return {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      status: "Active",
      ...(trimmed ? { search: trimmed } : {}),
      ...(menuId ? { "applicableMenu.menuId": menuId } : {}),
      ...(scope ? { [scopeKey]: scope } : {}),
    },
    sort,
    distance: Number(distance) || DEFAULT_BROWSE_DISTANCE,
  };
};

export const getData = async (
  type: FilterType,
  params: Record<string, any>,
): Promise<FilterItem[]> => {
  try {
    if (type === "brand") {
      const response = await SellerCatalogService.getNetworkBrands(params);
      return SellerCatalogService.formatBrandResponse(
        response.data?.data || [],
      ) as FilterItem[];
    }
    const response = await SellerCatalogService.getNetworkCategories(params);
    return SellerCatalogService.formatCategoryResponse(
      response.data?.data || [],
    ) as FilterItem[];
  } catch (error) {
    console.error(`Error fetching ${type}s:`, error);
    return [];
  }
};

export const getCount = async (
  type: FilterType,
  params: Record<string, any>,
): Promise<number> => {
  try {
    const countParams = { ...params, outputType: "count" };
    const response =
      type === "brand"
        ? await SellerCatalogService.getNetworkBrands(countParams)
        : await SellerCatalogService.getNetworkCategories(countParams);
    return response.data?.count || 0;
  } catch (error) {
    console.error(`Error fetching ${type} count:`, error);
    return 0;
  }
};
