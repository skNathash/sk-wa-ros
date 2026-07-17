import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareRefinementParams = (filter: Record<string, any>) => {
  let params: Record<string, any> = {
    showColumns: ["catArray", "brandArray"],
  };

  // Initialize filter object if not exists
  if (!params.filter) {
    params.filter = {};
  }

  let categories = [];
  let menu = [];

  if (filter.menu?.length > 0) {
    menu = filter.menu?.map((m: any) => m._id);
  }

  // Use selectedCategories if available, otherwise fall back to categories
  if (filter.activeTab === "brand" && filter.selectedCategories?.length > 0) {
    categories = filter.selectedCategories.map((c: any) => c._id);
    menu = [];
  }

  if (menu.length > 0 || categories.length > 0) {
    params.filter.category = [...categories, ...menu];
  }

  return params;
};

const getSellerCategories = async (params: Record<string, any>) => {
  const categoriesResp = await SellerCatalogService.getCategories(params);
  return {
    data: SellerCatalogService.formatCategoryResponse(
      categoriesResp.data?.data || []
    ),
  };
};

const getSellerBrands = async (params: Record<string, any>) => {
  const brandsResp = await SellerCatalogService.getBrands(params);
  return {
    data: SellerCatalogService.formatBrandResponse(brandsResp.data?.data || []),
  };
};

const prepareBrandsParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  refinementData: Record<string, any>
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    sort: "name",
  };

  params.filter._id = {
    $in: refinementData.brandArray?.map((b: any) => b._id),
  };

  // Add search functionality
  if (filter.searchQuery) {
    params.filter.name = { $regex: filter.searchQuery, $options: "i" };
  }

  return params;
};

const prepareCategoriesParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  refinementData: Record<string, any>
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    categoryFilter: {},
    sort: "name",
  };

  params.filter._id = {
    $in: refinementData.catArray?.map((c: any) => c._id),
  };

  // Add search functionality
  if (filter.searchQuery) {
    params.filter.name = { $regex: filter.searchQuery, $options: "i" };
  }

  return params;
};

export const prepareSellerBrandParams = (
  filter: Record<string, any>,
  pagination: PaginationState
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    sort: {
      "_id.brandName": 1,
    },
  };

  // Filter brands by category if selectedCategories are present
  if (filter.selectedCategories?.length > 0) {
    params.filter["applicableCategory.categoryId"] = {
      $in: filter.selectedCategories.map((c: any) => c._id),
    };
  }

  if (filter.menu?.length > 0) {
    params.filter["applicableMenu.menuId"] = {
      $in: filter.menu.map((m: any) => m._id),
    };
  }

  // Add search functionality
  if (filter.searchQuery) {
    params.filter.search = filter.searchQuery;
  }

  return params;
};

export const prepareSellerCategoryParams = (
  filter: Record<string, any>,
  pagination: PaginationState
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    sort: {
      "_id.categoryName": 1,
    },
  };

  if (filter.menu?.length > 0) {
    params.filter["applicableMenu.menuId"] = {
      $in: filter.menu.map((m: any) => m._id),
    };
  }

  // Add search functionality
  if (filter.searchQuery) {
    params.filter.search = filter.searchQuery;
  }

  return params;
};

export const getRefinementData = async (params: Record<string, any>) => {
  const refinementResp = await ProductService.getDealRefinement(params);
  return refinementResp.data;
};

export const getBrands = async (
  viewType: string,
  filter: Record<string, any>,
  pagination: PaginationState,
  refinementData: Record<string, any>
) => {
  if (viewType === "buyer") {
    const params = prepareSellerBrandParams(filter, pagination);
    return await getSellerBrands(params);
  }
  const params = prepareBrandsParams(filter, pagination, refinementData);
  const brandsResp = await ProductService.getBrandsOld(params);
  return { data: brandsResp.data };
};

export const getCategories = async (
  viewType: string,
  filter: Record<string, any>,
  pagination: PaginationState,
  refinementData: Record<string, any>
) => {
  if (viewType === "buyer") {
    const params = prepareSellerCategoryParams(filter, pagination);
    return await getSellerCategories(params);
  }
  const params = prepareCategoriesParams(filter, pagination, refinementData);
  const categoriesResp = await ProductService.getCategoriesOld(params);
  return { data: categoriesResp.data };
};

export const getBrandCount = async (
  viewType: string,
  filter: Record<string, any>,
  pagination: PaginationState,
  refinementData: Record<string, any>
) => {
  if (viewType === "buyer") {
    const params = prepareSellerBrandParams(filter, pagination);
    // Remove pagination params for count
    delete params.page;
    delete params.count;
    const brandsCountResp = await SellerCatalogService.getBrands({
      ...params,
      outputType: "count",
    });
    return { data: { count: brandsCountResp.data?.count || 0 } };
  }
  const params = prepareBrandsParams(filter, pagination, refinementData);
  const brandsCountResp = await ProductService.getBrandsCountOld(params);
  return { data: brandsCountResp.data };
};

export const getCategoriesCount = async (
  viewType: string,
  filter: Record<string, any>,
  pagination: PaginationState,
  refinementData: Record<string, any>
) => {
  if (viewType === "buyer") {
    const params = prepareSellerCategoryParams(filter, pagination);
    // Remove pagination params for count
    delete params.page;
    delete params.count;
    const categoriesCountResp = await SellerCatalogService.getCategories({
      ...params,
      outputType: "count",
    });
    return { data: { count: categoriesCountResp.data?.count || 0 } };
  }
  const params = prepareCategoriesParams(filter, pagination, refinementData);
  const categoriesCountResp = await ProductService.getCategoriesCountOld(
    params
  );
  return { data: categoriesCountResp.data };
};
