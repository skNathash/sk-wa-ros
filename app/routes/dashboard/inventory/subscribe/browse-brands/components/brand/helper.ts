import type { PaginationState } from "~/types/CommonTypes";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import CommonService from "~/services/CommonService";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getBrands(params);
    return {
      data: InventorySubscribeService.formatBrandResponse(
        response.data?.data || []
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
    const response = await InventorySubscribeService.getBrandsCount(p);
    return response.data?.data?.totalGroups || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const prepareParams = (
  params: Record<string, any>,
  pagination: PaginationState
) => {
  // Shared deal filter, so each tile's count matches the list it opens.
  let p: Record<string, any> = {
    ...InventorySubscribeService.getSubscribableDealParams(),
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { sortType: "popular" },
  };

  // Handle search filter
  if (params.search) {
    const search = params.search.trim();
    if (search) {
      // p.search = search;
      p.filter["applicableBrand.brandName"] = { $regex: search, $options: "i" };
    }
  }

  // Handle alpha filter
  if (params.alpha) {
    p.filter["applicableBrand.brandName"] =
      CommonService.prepareAlphaRegexFilter(params.alpha);
  }

  if (params.category?._id) {
    p.filter["applicableCategory.categoryId"] = params.category._id;
  }

  // Menu filter (from the menu chip strip).
  if (params.menuId) {
    p.filter["applicableMenu.menuId"] = params.menuId;
  }

  if (params.sortType) {
    p.sort = InventorySubscribeService.getSortParams(
      "brand",
      params.sortType
    )?.sort;
  }

  return p;
};
