import SellerCatalogService from "~/services/SellerCatalogService";
import CommonService from "~/services/CommonService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: { search?: string; alpha?: string; menuId?: string } = {},
  pagination: PaginationState,
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {},
    sort: { "_id.categoryName": 1 },
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

  if (menuId) {
    params.filter["applicableMenu.menuId"] = menuId;
  }

  return params;
};

export const getData = async (
  params: Record<string, any>,
  distance: number,
) => {
  try {
    const response = await SellerCatalogService.getNetworkCategories(
      params,
      distance,
    );
    return SellerCatalogService.formatCategoryResponse(
      response.data?.data || [],
    );
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getCount = async (
  params: Record<string, any>,
  distance: number,
) => {
  const p = { ...params };
  delete p.page;
  delete p.count;
  try {
    const response = await SellerCatalogService.getNetworkCategories(
      {
        ...p,
        outputType: "count",
      },
      distance,
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
