import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (filter: any, pagination: PaginationState) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  // Add availableQuantity filter unless stockStatus is "OutofStock"
  // if (filter.stockStatus !== "OutofStock") {
  //   params.filter.availableQuantity = {
  //     $gt: 0,
  //   };
  // }

  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  const extractId = (value: any) => {
    if (value == null) return undefined;
    if (Array.isArray(value)) value = value[0];
    if (!value) return undefined;
    return value?.value?.id ?? value?.id ?? value?.value ?? value;
  };

  const menuId = filter.menuId ?? extractId(filter.menu);
  const categoryId = filter.categoryId ?? extractId(filter.category);
  const brandId = filter.brandId ?? extractId(filter.brand);

  // Multi-select ids coming from the left-side Brand / Category filters.
  const toIdList = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    return String(value).split(",").filter(Boolean);
  };
  const selectedCatIds = toIdList(filter.selectedCatIds);
  const selectedBrandIds = toIdList(filter.selectedBrandIds);

  if (menuId) {
    params.filter["applicableMenu.menuId"] = menuId;
  }

  // Categories: combine the single-select category (if any) with the
  // multi-select ids from the Category filter and match against both
  // applicableCategory and applicableParentCategory.
  const categoryIds = [
    ...(categoryId ? [String(categoryId)] : []),
    ...selectedCatIds,
  ].filter((id, idx, arr) => arr.indexOf(id) === idx);

  if (categoryIds.length > 0) {
    const catMatch =
      categoryIds.length > 1 ? { $in: categoryIds } : categoryIds[0];
    params.filter.$or = [
      {
        "applicableCategory.categoryId": catMatch,
      },
      {
        "applicableParentCategory.categoryId": catMatch,
      },
    ];
  }

  // Brands: combine the single-select brand (if any) with the multi-select
  // ids from the Brand filter.
  const brandIds = [
    ...(brandId ? [String(brandId)] : []),
    ...selectedBrandIds,
  ].filter((id, idx, arr) => arr.indexOf(id) === idx);

  if (brandIds.length > 0) {
    params.filter["applicableBrand.brandId"] =
      brandIds.length > 1 ? { $in: brandIds } : brandIds[0];
  }

  // Handle feature filter
  if (filter.feature === "newlyLaunched") {
    return SellerCatalogService.getNetworkNewlyLaunchedParams(params);
  } else if (filter.feature === "topSelling") {
    return SellerCatalogService.getNetworkTopSellingParams(params);
  } else if (filter.feature === "promotionalDeals") {
    return SellerCatalogService.getNetworkPromotionalDealParams(params);
  } else if (filter.feature === "lowStock") {
    return SellerCatalogService.getRecommendNetworkMyLowStockParams(params);
  } else if (filter.feature === "outOfStock") {
    return SellerCatalogService.getRecommendNetworkMyOutofStockParams(params);
  } else if (filter.feature === "pormotionalDeals") {
    return SellerCatalogService.getNetworkPromotionalDealParams(params);
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
    return SellerCatalogService.formatProductResponse(data);
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

export const applyFormDataToSearchParams = (
  formData: any,
  currentSearchParams: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
) => {
  const newParams = new URLSearchParams(currentSearchParams);

  // Clear existing filter params
  newParams.delete("menuId");
  newParams.delete("menuName");
  newParams.delete("categoryId");
  newParams.delete("categoryName");
  newParams.delete("brandId");
  newParams.delete("brandName");
  newParams.delete("feature");

  const menuItem = Array.isArray(formData?.menu)
    ? formData.menu[0]
    : formData?.menu || null;
  const categoryItem = Array.isArray(formData?.category)
    ? formData.category[0]
    : formData?.category || null;
  const brandItem = Array.isArray(formData?.brand)
    ? formData.brand[0]
    : formData?.brand || null;

  if (menuItem?.value?.id || menuItem?.id) {
    const id = menuItem.value?.id || menuItem.id;
    const name = menuItem.value?.name || menuItem.name || "";
    newParams.set("menuId", id);
    newParams.set("menuName", name);
  }

  if (categoryItem?.value?.id || categoryItem?.id) {
    const id = categoryItem.value?.id || categoryItem.id;
    const name = categoryItem.value?.name || categoryItem.name || "";
    newParams.set("categoryId", id);
    newParams.set("categoryName", name);
  }

  if (brandItem?.value?.id || brandItem?.id) {
    const id = brandItem.value?.id || brandItem.id;
    const name = brandItem.value?.name || brandItem.name || "";
    newParams.set("brandId", id);
    newParams.set("brandName", name);
  }

  // Handle stockStatus
  if (formData?.stockStatus && formData.stockStatus !== "") {
    newParams.set("stockStatus", formData.stockStatus);
  }

  // Handle movementType
  if (formData?.movementType && formData.movementType !== "") {
    newParams.set("movementType", formData.movementType);
  }

  // Handle tags
  if (Array.isArray(formData?.tags) && formData.tags.length > 0) {
    newParams.set("tags", formData.tags.join(","));
  }

  // Handle feature
  if (formData?.feature && formData.feature !== "") {
    newParams.set("feature", formData.feature);
  }

  setSearchParams(newParams);
};

export const prepareFormDataFromSearchParams = (
  searchParams: URLSearchParams,
) => {
  const initialValues: any = {
    menu: [],
    category: [],
    brand: [],
    feature: "",
  };

  if (searchParams.get("menuId")) {
    initialValues.menu = [
      {
        label: searchParams.get("menuName") || "",
        value: {
          id: searchParams.get("menuId"),
          name: searchParams.get("menuName") || "",
        },
      },
    ];
  }

  if (searchParams.get("categoryId")) {
    initialValues.category = [
      {
        label: searchParams.get("categoryName") || "",
        value: {
          id: searchParams.get("categoryId"),
          name: searchParams.get("categoryName") || "",
        },
      },
    ];
  }

  if (searchParams.get("brandId")) {
    initialValues.brand = [
      {
        label: searchParams.get("brandName") || "",
        value: {
          id: searchParams.get("brandId"),
          name: searchParams.get("brandName") || "",
        },
      },
    ];
  }

  // Handle stockStatus
  if (searchParams.get("stockStatus")) {
    initialValues.stockStatus = searchParams.get("stockStatus")!;
  }

  // Handle movementType
  if (searchParams.get("movementType")) {
    initialValues.movementType = searchParams.get("movementType")!;
  }

  // Handle tags
  if (searchParams.get("tags")) {
    initialValues.tags = searchParams.get("tags")!.split(",").filter(Boolean);
  }

  // Handle feature
  if (searchParams.get("feature")) {
    initialValues.feature = searchParams.get("feature")!;
  }

  return initialValues;
};
