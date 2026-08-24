import type { PaginationState } from "~/types/CommonTypes";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import CommonService from "~/services/CommonService";

type BrandSourceType = "subscribe" | "inventory";

export const getData = async (
  type: BrandSourceType,
  params: Record<string, any>
) => {
  try {
    if (type === "subscribe") {
      const response = await InventorySubscribeService.getBrands(params);
      return {
        data: InventorySubscribeService.formatBrandResponse(
          response.data?.data || []
        ),
      };
    }

    // default -> inventory
    const response = await SellerCatalogService.getBrands(params);
    return {
      data: SellerCatalogService.formatBrandResponse(
        response?.data?.data || [],
        true
      ).map((e) => ({
        ...e,
        totalDeals: e._raw?.totalDeals || 0,
      })),
    };
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (
  type: BrandSourceType,
  params: Record<string, any>
) => {
  const p = { ...params };
  delete p.page;
  delete p.count;

  try {
    if (type === "subscribe") {
      const response = await InventorySubscribeService.getBrandsCount(p);
      // subscribe response returns totalGroups in nested data
      return response.data?.data?.totalGroups || 0;
    }

    // inventory - SellerCatalogService expects outputType=count
    const response = await SellerCatalogService.getBrands({
      ...p,
      outputType: "count",
    });
    return response?.data?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const prepareSubscribeParams = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  const p: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {},
    sort: {
      "_id.brandName": 1,
    },
    dealSubscribeType: filters.dealSubscribeType || "NOTSUBSCRIBED",
  };

  // search
  if (filters?.search?.trim()) {
    const search = filters.search.trim();
    p.filter["applicableBrand.brandName"] = { $regex: search, $options: "i" };
  }

  // alpha
  if (filters?.alpha) {
    p.filter["applicableBrand.brandName"] =
      CommonService.prepareAlphaRegexFilter(filters.alpha);
  }

  // category filter mapping
  if (filters?.category?._id) {
    p.filter["applicableCategory.categoryId"] = filters.category._id;
  }

  // menu filter (from the menu chip strip)
  if (filters?.menuId) {
    p.filter["applicableMenu.menuId"] = filters.menuId;
  }

  // sortType
  if (filters.sortType) {
    p.sort = InventorySubscribeService.getSortParams(
      "brand",
      filters.sortType
    )?.sort;
  }

  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  return p;
};

const prepareInventoryParams = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  const p: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {},
    sort: {
      "_id.brandName": 1,
    },
  };

  // search
  if (filters?.search?.trim()) {
    const search = filters.search.trim();
    p.filter.search = search;
  }

  // alpha
  if (filters?.alpha) {
    p.filter["applicableBrand.brandName"] =
      CommonService.prepareAlphaRegexFilter(filters.alpha);
  }

  // category filter mapping
  if (filters?.category?._id) {
    p.filter["applicableCategory.categoryId"] = filters.category._id;
  }

  // menu filter (from the menu chip strip)
  if (filters?.menuId) {
    p.filter["applicableMenu.menuId"] = filters.menuId;
  }

  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  return p;
};

export const prepareParams = (
  type: BrandSourceType,
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  if (type === "subscribe") {
    return prepareSubscribeParams(filters, pagination);
  }
  return prepareInventoryParams(filters, pagination);
};

export default {
  getData,
  getCount,
  prepareParams,
};
