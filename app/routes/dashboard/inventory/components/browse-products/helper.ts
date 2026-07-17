import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";

export const SORT_OPTIONS = SellerCatalogService.getGlobalSortOptions();

export const prepareParams = (filter: any, pagination: any) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  const sortType = filter.sortType || "";

  if (sortType) {
    if (sortType === "sort-az") {
      params.sort = { dealName: 1 };
    } else if (sortType === "sort-za") {
      params.sort = { dealName: -1 };
    } else if (sortType === "only-active") {
      params.filter.status = "Active";
    } else if (sortType === "only-inactive") {
      params.filter.status = "Inactive";
    } else if (sortType === "without-stock") {
      params.filter.availableQuantity = { $lte: 0 };
    } else {
      const movmentTypes = SellerCatalogService.getMovementTypes();
      const movementType = movmentTypes.find((type) => type.value === sortType);
      if (movementType) {
        params.filter.velocity = movementType.value;
      } else {
        params.sort = sortType;
      }
    }
  }

  if (filter?.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  if (filter.alpha) {
    params.filter.dealName = CommonService.prepareAlphaRegexFilter(
      filter.alpha
    );
  }

  if (filter?.category?.value) {
    params.filter["applicableCategory.categoryId"] = filter.category.value?.id;
  }

  if (filter?.brand?.value) {
    params.filter["applicableBrand.brandId"] = filter.brand.value?.id;
  }

  // Support direct ids passed from browse components
  if (filter?.categoryId) {
    params.filter["applicableCategory.categoryId"] = filter.categoryId;
  }

  if (filter?.brandId) {
    params.filter["applicableBrand.brandId"] = filter.brandId;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts(params, {
      showOutOfStock: true,
    });
    return SellerCatalogService.formatProductResponse(
      response.data?.data || []
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts({
      ...params,
      outputType: "count",
    });
    if (response.statusCode === 200 && response.data?.count) {
      return response.data?.count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching products count:", error);
    return 0;
  }
};
