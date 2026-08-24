import type { PaginationState } from "~/types/CommonTypes";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import CommonService from "~/services/CommonService";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getCategories(params);
    return {
      data: InventorySubscribeService.formatCategoryResponse(
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
    const response = await InventorySubscribeService.getCategoriesCount(p);
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
      p.filter["applicableCategory.categoryName"] = {
        $regex: search,
        $options: "i",
      };
    }
  }

  // Add menu filter if present
  if (params.menuId) {
    p.filter["applicableMenu.menuId"] = params.menuId;
  }

  // Add parent category filter if present
  if (params.parentCategoryId) {
    // single parent id
    p.filter["applicableParentCategory.categoryId"] = params.parentCategoryId;
  }

  if (params.alpha) {
    p.filter["applicableCategory.categoryName"] =
      CommonService.prepareAlphaRegexFilter(params.alpha);
  }

  if (params.sortType) {
    p.sort = InventorySubscribeService.getSortParams(
      "category",
      params.sortType
    )?.sort;
  }

  return p;
};
