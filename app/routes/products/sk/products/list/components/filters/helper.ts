import ProductService from "~/services/ProductService";
import type { PaginationState } from "~/types/CommonTypes";

export type FilterType = "brand" | "category";

export type FilterItem = {
  _id: string;
  name: string;
  _displayName?: string;
  dealsCount?: number;
};

const toIdList = (value?: string | string[]): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return String(value).split(",").filter(Boolean);
};

/** Category / brand ids (comma-separated or array) that scope a refinement. */
export type RefinementScope = {
  category?: string | string[];
  brand?: string | string[];
};

/**
 * Derive the brand / category ids available for the current cross-filter scope
 * via the deal refinement API. Brands are scoped by the selected categories
 * (and the current menu); categories by the selected brands AND the current
 * menu/category context so the panel is constrained even before a brand is
 * picked.
 *
 * Returns `null` when no scope is provided so the caller knows to list every
 * brand / category instead of constraining by id.
 */
export const getRefinementIds = async (
  type: FilterType,
  scope: RefinementScope,
): Promise<string[] | null> => {
  const category = toIdList(scope.category);
  const brand = toIdList(scope.brand);
  if (!category.length && !brand.length) return null;
  try {
    // The refinement API exposes the scoped ids as objects under
    // `brandArray` / `catArray` (see the product filter modal and
    // BrandInCategory) — NOT under `brand` / `category`.
    const column = type === "brand" ? "brandArray" : "catArray";
    const filter: Record<string, any> = {};
    if (category.length) filter.category = category;
    if (brand.length) filter.brand = brand;
    const response = await ProductService.getDealRefinement({
      filter,
      showColumns: [column],
    });
    const arr = (response.data?.[column] || []) as Array<{ _id: string }>;
    return arr.map((item) => item._id).filter(Boolean);
  } catch (error) {
    console.error(`Error fetching ${type} refinement ids:`, error);
    return [];
  }
};

export type FilterParams = {
  /**
   * Ids the list must be constrained to (from the refinement step). `null`
   * means "no scope" — list everything; `[]` means the scope matched nothing.
   */
  ids?: string[] | null;
  search?: string;
};

export const prepareParams = (
  type: FilterType,
  filter: FilterParams,
  pagination: PaginationState,
): Record<string, any> => {
  const { ids, search } = filter;
  const trimmed = search?.trim();

  if (type === "brand") {
    const brandFilter: Record<string, any> = {};
    if (trimmed) brandFilter.name = { $regex: trimmed, $options: "i" };
    if (ids) brandFilter._id = { $in: ids };
    return {
      page: pagination.activePage,
      count: pagination.rowsPerPage,
      brandFilter,
      sort: { name: 1 },
    };
  }

  const and: Record<string, any>[] = [];
  if (ids) and.push({ _id: { $in: ids } });
  if (trimmed) and.push({ name: { $regex: trimmed, $options: "i" } });

  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: "name",
  };
  if (and.length) params.filter = { $and: and };
  return params;
};

const formatItems = (items: any[]): FilterItem[] =>
  (items || []).map((it) => ({
    _id: it._id,
    name: it.name,
    _displayName: it._displayName || it.name,
    dealsCount: it.dealsCount,
  }));

export const getData = async (
  type: FilterType,
  params: Record<string, any>,
): Promise<FilterItem[]> => {
  try {
    if (type === "brand") {
      const response = await ProductService.getSpcBrands(params);
      return formatItems(response.data || []);
    }
    const response = await ProductService.getCategoriesOld(params);
    return formatItems(response.data || []);
  } catch (error) {
    console.error(`Error fetching ${type}s:`, error);
    return [];
  }
};

export const getCount = async (
  type: FilterType,
  params: Record<string, any>,
): Promise<number> => {
  const p = { ...params };
  delete p.page;
  delete p.count;
  try {
    if (type === "brand") {
      const response = await ProductService.getSpcBrands({
        ...p,
        outputType: "count",
      });
      return response.data?.[0]?.count || 0;
    }
    const response = await ProductService.getCategoriesCountOld(p);
    return response.data || 0;
  } catch (error) {
    console.error(`Error fetching ${type} count:`, error);
    return 0;
  }
};
