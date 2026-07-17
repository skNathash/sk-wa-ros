import ProductService from "~/services/ProductService";
import type { PaginationState } from "~/types/CommonTypes";

/** Pull a usable id out of a form value (array / {value:{id}} / {_id} / string). */
const extractId = (value: any): string | undefined => {
  if (value == null) return undefined;
  if (Array.isArray(value)) value = value[0];
  if (!value) return undefined;
  const id = value?.value?.id ?? value?.id ?? value?._id ?? value?.value ?? value;
  return id == null ? undefined : String(id);
};

const toIdList = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return String(value).split(",").filter(Boolean);
};

const dedupe = (arr: string[]) =>
  arr.filter((id, idx, all) => Boolean(id) && all.indexOf(id) === idx);

export const prepareParams = (
  filter: any,
  pagination: PaginationState,
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    excludeOutOfStock: true,
    showSkCatalog: true,
  };

  const f: Record<string, any> = {};

  const menuId = filter.menuId ?? extractId(filter.menu);
  const categoryId = filter.categoryId ?? extractId(filter.category);
  const brandId = filter.brandId ?? extractId(filter.brand);

  // Menus and categories both map to the deal `category` field in the SK
  // catalog. Combine the single-select ids from the filter modal with the
  // multi-select ids coming from the left-side Category filter.
  const categoryIds = dedupe([
    ...(menuId ? [String(menuId)] : []),
    ...(categoryId ? [String(categoryId)] : []),
    ...toIdList(filter.selectedCatIds),
  ]);
  if (categoryIds.length > 0) {
    f.category = categoryIds;
  }

  // Brands: single-select id (modal) + multi-select ids (left Brand filter).
  const brandIds = dedupe([
    ...(brandId ? [String(brandId)] : []),
    ...toIdList(filter.selectedBrandIds),
  ]);
  if (brandIds.length > 0) {
    f.brand = brandIds;
  }

  const trimmed = filter.search?.trim();
  if (trimmed) {
    // Direct deal id lookups use the `D<number>` convention.
    if (/^D\d+$/.test(trimmed)) {
      f._id = trimmed;
    } else {
      f.name = { $regex: trimmed, $options: "i" };
    }
  }

  if (Object.keys(f).length > 0) {
    params.filter = f;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await ProductService.getProducts(params);
    const dataArray: any[] = response.data || [];

    // Move out-of-stock items to the end while preserving relative order.
    const inStock: any[] = [];
    const outOfStock: any[] = [];
    for (const item of dataArray) {
      if (item && item.isOutOfStock) outOfStock.push(item);
      else inStock.push(item);
    }

    return [...inStock, ...outOfStock].map((e) => ({
      ...e,
      showOtherDeals: true,
    }));
  } catch (error) {
    console.error("Error fetching SK products:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };
  delete p.page;
  delete p.count;

  try {
    const response = await ProductService.getProductCount(p);
    return response.count || 0;
  } catch (error) {
    console.error("Error fetching SK products count:", error);
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

  setSearchParams(newParams);
};

export const prepareFormDataFromSearchParams = (
  searchParams: URLSearchParams,
) => {
  const initialValues: any = {
    menu: [],
    category: [],
    brand: [],
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

  return initialValues;
};
