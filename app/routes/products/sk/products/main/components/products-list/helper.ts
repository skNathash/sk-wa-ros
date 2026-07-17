import ProductService from "~/services/ProductService";

export type ProductsListFilter = {
  menuId?: string;
  search?: string;
};

export const prepareParams = (
  filter: ProductsListFilter,
  page: number,
  count: number,
): Record<string, any> => {
  const { menuId, search } = filter || {};
  const trimmed = search?.trim();

  const result: Record<string, any> = {
    page,
    count,
    excludeOutOfStock: true,
    showSkCatalog: true,
  };

  const f: Record<string, any> = {};

  if (menuId) {
    f.category = [menuId];
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

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await ProductService.getProducts(params);
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
