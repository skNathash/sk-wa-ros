import { UN_BRAND_ID } from "~/constants";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: {
    menu?: any[];
    category?: any[];
    search?: string;
    sortType?: string;
  } = {},
  pagination: PaginationState
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {
      "applicableBrand.brandId": UN_BRAND_ID,
    },
    dealSubscribeType: "NOTSUBSCRIBED",
  };

  const { menu, category, search, sortType } = filter || {};

  // Apply sort based on sortType
  if (sortType) {
    const sortParams = InventorySubscribeService.getSortParams(
      "category",
      sortType
    );
    if (sortParams?.sort) {
      params.sort = sortParams.sort;
    }
  } else {
    // Default sort
    params.sort = {
      "_id.categoryName": 1,
    };
  }

  if (search) {
    params.search = search?.trim();
  }

  if (menu && menu.length > 0) {
    const menuId = menu[0]?.value?.id;
    params.filter["applicableMenu.menuId"] = menuId;
  }

  if (category && category.length > 0) {
    const categoryIds = category
      .filter((c: any) => c?.value?.id !== "all")
      .map((c: any) => c?.value?.id)
      .filter(Boolean);
    if (categoryIds.length > 0) {
      params.filter["applicableParentCategory.categoryId"] = {
        $in: categoryIds,
      };
    }
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getCategories(params);
    const data = InventorySubscribeService.formatCategoryResponse(
      response.data?.data || []
    );

    try {
      const localCart = InventorySubscribeService.getLocalCart() || [];
      // mark isSubscribed true if any local cart item has subCategoryId matching category._id
      const categoryMap = new Map<string, boolean>();
      for (const item of localCart) {
        if (item.subCategoryId) {
          categoryMap.set(item.subCategoryId, true);
        }
      }

      const mapped = data.map((cat: any) => ({
        ...cat,
        isSubscribed: !!categoryMap.get(cat._id),
      }));

      return { data: mapped };
    } catch (e) {
      return { data };
    }
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
