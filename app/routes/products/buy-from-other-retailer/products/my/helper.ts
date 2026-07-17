import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState, TabItem } from "~/types/CommonTypes";

export type FilterType = {
  tab: string;
  search: string;
  menu: { label: string; value: { id: string; name: string } }[];
  category: { label: string; value: { id: string; name: string } }[];
  brand: { label: string; value: { id: string; name: string } }[];
};

export const tabs: TabItem[] = [
  { name: "Low Stock Products", key: "low-stock", langKey: "lowStockProducts" },
  {
    name: "Out of Stock Products",
    key: "out-of-stock",
    langKey: "outOfStockProducts",
  },
  // { name: "All Products", key: "all", langKey: "allProducts" },
];

export const defaultFilter: FilterType = {
  tab: tabs[0].key,
  search: "",
  menu: [],
  category: [],
  brand: [],
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  if (filter.search) {
    params.filter.search = filter.search;
  }

  if (filter.menu?.length > 0) {
    params.filter["applicableMenu.menuId"] = {
      $in: filter.menu.map((item: any) => item.value.id),
    };
  }

  // Multi-select ids coming from the left-side Brand / Category filters.
  const toIdList = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    return String(value).split(",").filter(Boolean);
  };
  const selectedCatIds = toIdList(filter.selectedCatIds);
  const selectedBrandIds = toIdList(filter.selectedBrandIds);

  // Categories: combine the single-select category (from the filter modal)
  // with the multi-select ids from the left-side Category filter.
  const categoryIds = [
    ...(filter.category?.map((item: any) => item.value.id) ?? []),
    ...selectedCatIds,
  ].filter((id, idx, arr) => id && arr.indexOf(id) === idx);

  if (categoryIds.length > 0) {
    params.filter["applicableCategory.categoryId"] = { $in: categoryIds };
  }

  // Brands: combine the single-select brand with the multi-select ids from the
  // left-side Brand filter.
  const brandIds = [
    ...(filter.brand?.map((item: any) => item.value.id) ?? []),
    ...selectedBrandIds,
  ].filter((id, idx, arr) => id && arr.indexOf(id) === idx);

  if (brandIds.length > 0) {
    params.filter["applicableBrand.brandId"] = { $in: brandIds };
  }

  if (filter.tab === "low-stock") {
    params = SellerCatalogService.getRecommendNetworkMyLowStockParams(params);
  } else if (filter.tab === "out-of-stock") {
    params = SellerCatalogService.getRecommendNetworkMyOutofStockParams(params);
  }

  return params;
};

export const getData = async (
  params: Record<string, any>,
  distance: number,
) => {
  const response = await SellerCatalogService.getNetworkDeals(params, distance);
  const data = response.data?.data || [];
  return SellerCatalogService.formatProductResponse(data);
};

export const getCount = async (
  params: Record<string, any>,
  distance: number,
) => {
  const response = await SellerCatalogService.getNetworkDeals(
    {
      ...params,
      outputType: "count",
    },
    distance,
  );
  return response.data?.count || 0;
};
