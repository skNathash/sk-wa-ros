import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

/**
 * Build the params for the grouped-by-category listing that drives the
 * accordion list (one row per category, with its SKU count).
 */
export const prepareParams = (
  filter: {
    search?: string;
    alpha?: string;
    menuId?: string;
  } = {},
  pagination: PaginationState,
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {},
    sort: {
      "_id.categoryName": 1,
    },
  };

  const { search, alpha, menuId } = filter || {};

  if (search) {
    params.filter["applicableCategory.categoryName"] = {
      $regex: search,
      $options: "i",
    };
  }

  if (alpha) {
    params.filter["applicableCategory.categoryName"] =
      CommonService.prepareAlphaRegexFilter(alpha);
  }

  // Menu filter (from the menu chip strip).
  if (menuId) {
    params.filter["applicableMenu.menuId"] = menuId;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getCategories(params);
    return {
      data: SellerCatalogService.formatCategoryResponse(
        response.data?.data || [],
        true,
      ),
    };
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };
  delete p.page;
  delete p.count;
  try {
    const response = await SellerCatalogService.getCategories({
      ...p,
      outputType: "count",
    });
    return response.data?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

/**
 * Fetch the top deals for a single category — used to fill the expanded panel
 * of a category block. Sorted by SKU name so the preview is stable.
 */
export const getCategoryDeals = async (
  categoryId: string,
  { page = 1, count = 4 }: { page?: number; count?: number } = {},
) => {
  const params: Record<string, any> = {
    page,
    count,
    sort: { dealName: 1 },
    filter: {
      "applicableCategory.categoryId": categoryId,
    },
  };

  try {
    const response = await SellerCatalogService.getProducts(params, {
      showOutOfStock: true,
    });
    return SellerCatalogService.formatProductResponse(
      response.data?.data || [],
    );
  } catch (error) {
    console.error(error);
    return [];
  }
};
