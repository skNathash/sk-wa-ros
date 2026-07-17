import ProductService from "~/services/ProductService";

export type ProductsFilter = {
  menuId?: string;
  brandId?: string;
  categoryId?: string;
  search?: string;
};

export const prepareParams = (
  filter: ProductsFilter,
  page: number,
  count: number,
): Record<string, any> => {
  const { menuId, brandId, categoryId, search } = filter || {};
  const trimmed = search?.trim();

  const result: Record<string, any> = {
    page,
    count,
    excludeOutOfStock: true,
    showSkCatalog: true,
  };

  const f: Record<string, any> = {};

  // Menus and categories both map to the deal `category` field in the SK
  // catalog. Prefer the most specific id so a selected (sub)category narrows
  // the results instead of widening them to the whole parent menu.
  const categoryId_ = categoryId || menuId;
  if (categoryId_) {
    f.category = [categoryId_];
  }

  if (brandId) {
    f.brand = [brandId];
  }

  if (trimmed) {
    // Direct deal id lookups use the `D<number>` convention
    if (/^D\d+$/.test(trimmed)) {
      f._id = trimmed;
    } else {
      f.name = { $regex: trimmed, $options: "i" };
    }
  }

  if (Object.keys(f).length > 0) {
    result.filter = f;
  }

  return result;
};

export const getData = async (
  params: Record<string, any>,
  signal?: AbortSignal,
) => {
  try {
    const response = await ProductService.getProducts(params, { signal });
    const dataArray: any[] = response.data || [];

    // Move out-of-stock items to the end while preserving relative order
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

export const getCount = async (
  params: Record<string, any>,
  signal?: AbortSignal,
) => {
  const p = { ...params };
  delete p.page;
  delete p.count;

  try {
    const response = await ProductService.getProductCount(p, { signal });
    return response.count || 0;
  } catch (error) {
    console.error("Error fetching SK products count:", error);
    return 0;
  }
};
