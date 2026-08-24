import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (filter: any, pagination: PaginationState) => {
  // Same subscribable-deal base the subscribe search uses (active, branded,
  // non-local deals this seller hasn't subscribed to yet), so the results here
  // match what the seller can actually add.
  const params: Record<string, any> =
    InventorySubscribeService.getSubscribableDealParams({
      page: pagination.activePage,
      limit: pagination.rowsPerPage,
    });

  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  const toIdList = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    return String(value).split(",").filter(Boolean);
  };

  const menuIds = toIdList(filter.menuId);
  if (menuIds.length > 0) {
    params.filter["applicableMenu.menuId"] =
      menuIds.length > 1 ? { $in: menuIds } : menuIds[0];
  }

  const categoryIds = toIdList(filter.categoryId);
  if (categoryIds.length > 0) {
    const catMatch =
      categoryIds.length > 1 ? { $in: categoryIds } : categoryIds[0];
    params.filter.$or = [
      { "applicableCategory.categoryId": catMatch },
      { "applicableParentCategory.categoryId": catMatch },
    ];
  }

  const brandIds = toIdList(filter.brandId);
  if (brandIds.length > 0) {
    params.filter["applicableBrand.brandId"] =
      brandIds.length > 1 ? { $in: brandIds } : brandIds[0];
  }

  // Map the search filter chip to the corresponding network API params. Each
  // chip is a recommended-tag filter the API already understands; `moq` is a
  // plain sort (lowest minimum order quantity first). With no chip selected the
  // plain search params go out as-is — the tags are opted into, never a default.
  switch (filter.chip) {
    case "trending":
      return SellerCatalogService.getNetworkTopSellingParams(params);
    case "new-launches":
      return SellerCatalogService.getNetworkNewlyLaunchedParams(params);
    case "best-price":
      params.sort = "discount-desc";
      break;
    case "moq":
      params.sort = { b2bMinQuantity: 1 };
      break;
  }

  return params;
};

export const getData = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    let distanceParam: any = undefined;
    if (distance === "all") distanceParam = "all";
    else if (distance == null) distanceParam = undefined;
    else distanceParam = Number(distance);

    const response = await SellerCatalogService.getNetworkDeals(
      params,
      distanceParam,
    );
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data, {
      view: "buyer",
    });
  } catch (error) {
    console.error("Error fetching network deals:", error);
    return [];
  }
};

export const getCount = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    const countParams = { ...params, outputType: "count" };
    let distanceParam: any = undefined;
    if (distance === "all") distanceParam = "all";
    else if (distance == null) distanceParam = undefined;
    else distanceParam = Number(distance);

    const response = await SellerCatalogService.getNetworkDeals(
      countParams,
      distanceParam,
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching network deals count:", error);
    return 0;
  }
};
