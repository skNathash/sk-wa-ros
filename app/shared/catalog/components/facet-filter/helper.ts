import type { AxiosRequestConfig } from "axios";
import InventorySubscribeService from "~/services/InventorySubscribeService";

export type FacetItem = {
  id: string;
  name: string;
  rawId?: string;
};

export type Facets = {
  brands: FacetItem[];
  categories: FacetItem[];
  menus: FacetItem[];
};

export const EMPTY_FACETS: Facets = {
  brands: [],
  categories: [],
  menus: [],
};

// Number of brands shown inline before the "More" button.
export const INLINE_BRANDS_COUNT = 10;

// Number of categories shown inline below the brands.
export const INLINE_CATEGORIES_COUNT = 10;

const isAbortError = (error: any) =>
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

const normalizeBrands = (list: any[]): FacetItem[] =>
  (Array.isArray(list) ? list : [])
    .filter((b) => b?.brandId || b?.id)
    .map((b) => ({
      id: String(b.brandId ?? b.id),
      name: String(b.brandName ?? b.name ?? ""),
      rawId: b.id ? String(b.id) : undefined,
    }));

const normalizeCategories = (list: any[]): FacetItem[] =>
  (Array.isArray(list) ? list : [])
    .filter((c) => c?.categoryId || c?.id)
    .map((c) => ({
      id: String(c.categoryId ?? c.id),
      name: String(c.categoryName ?? c.name ?? ""),
      rawId: c.id ? String(c.id) : undefined,
    }));

const normalizeMenus = (list: any[]): FacetItem[] =>
  (Array.isArray(list) ? list : [])
    .filter((m) => m?.menuId || m?.id)
    .map((m) => ({
      id: String(m.menuId ?? m.id),
      name: String(m.menuName ?? m.name ?? ""),
      rawId: m.id ? String(m.id) : undefined,
    }));

/**
 * Fetch brand/category/menu facets for the given search term using the
 * InventorySubscribe products (deals) endpoint.
 *
 * The facets block is read defensively from either `data.facets` or
 * `data.data.facets` since the response envelope is not finalized.
 */
export const getFacets = async (
  search: string,
  config?: AxiosRequestConfig,
): Promise<Facets> => {
  try {
    const params: Record<string, any> = {
      filter: { status: "Active" },
      includeVariants: true,
    };
    const term = (search || "").trim();
    if (term) {
      params.search = term;
    }

    const response = await InventorySubscribeService.getDeals(params, config);

    const facets = response?.data?.facets || {};

    return {
      brands: normalizeBrands(facets.brands),
      categories: normalizeCategories(facets.categories),
      menus: normalizeMenus(facets.menus),
    };
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.error("Failed to load facets", error);
    return { ...EMPTY_FACETS };
  }
};
