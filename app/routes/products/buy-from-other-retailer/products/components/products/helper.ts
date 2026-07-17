import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export type ProductsFilter = {
  menuId?: string;
  brandId?: string;
  categoryId?: string;
  search?: string;
};

export const prepareParams = (
  filter: ProductsFilter,
  pagination: PaginationState,
): Record<string, any> => {
  const { menuId, brandId, categoryId, search } = filter || {};
  const trimmed = search?.trim();

  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      status: "Active",
      ...(trimmed ? { search: trimmed } : {}),
      ...(menuId ? { "applicableMenu.menuId": menuId } : {}),
      ...(brandId ? { "applicableBrand.brandId": brandId } : {}),
    },
    sort: { dealName: 1 },
  };

  if (categoryId) {
    params.filter.$or = [
      { "applicableCategory.categoryId": categoryId },
      { "applicableParentCategory.categoryId": categoryId },
    ];
  }

  return params;
};

export const getData = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    const distanceParam: any =
      distance === "all"
        ? "all"
        : distance == null
          ? undefined
          : Number(distance);
    const response = await SellerCatalogService.getNetworkDeals(
      params,
      distanceParam,
    );
    return SellerCatalogService.formatProductResponse(response.data?.data || []);
  } catch (error) {
    console.error("Error fetching network products:", error);
    return [];
  }
};

export const getCount = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  const countParams = { ...params, outputType: "count" };
  try {
    const distanceParam: any =
      distance === "all"
        ? "all"
        : distance == null
          ? undefined
          : Number(distance);
    const response = await SellerCatalogService.getNetworkDeals(
      countParams,
      distanceParam,
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching network products count:", error);
    return 0;
  }
};
