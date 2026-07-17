import { endOfDay, startOfDay } from "date-fns";
import CommonService from "~/services/CommonService";
import VendorService from "~/services/VendorService";
import type { PaginationState } from "~/types/CommonTypes";

export const DEFAULT_FILTER = {
  search: "",
  category: null,
  brand: null,
  alpha: "",
};

export type FilterFormData = {
  search: string;
  category: any[] | null;
  brand: any[] | null;
  alpha: string;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState | null,
  sort: { key: string; value: "asc" | "desc" } | null
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
    filter: {},
  };

  if (sort && sort.key) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  const search = filter.search?.trim();
  if (search) {
    params.filter.search = search;
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.alpha) {
    params.filter.search = CommonService.prepareAlphaRegexFilter(filter.alpha);
  }

  if (filter.status === "Active") {
    params.filter.isActive = true;
  } else if (filter.status === "Inactive") {
    params.filter.isActive = false;
  }

  if (filter.type && filter.type !== "All") {
    params.filter.position = filter.type;
  }

  // Category filter (array of objects)
  if (
    filter.category &&
    Array.isArray(filter.category) &&
    filter.category.length > 0
  ) {
    const categories = filter.category
      .map((cat: any) => cat?.value?.id)
      .filter(Boolean);
    if (categories.length > 0) {
      params.filter.categoryId = categories[0];
    }
  }

  // Brand filter (array of objects)
  if (filter.brand && Array.isArray(filter.brand) && filter.brand.length > 0) {
    const brands = filter.brand
      .map((brand: any) => brand?.value?.id)
      .filter(Boolean);
    if (brands.length > 0) {
      params.filter.brandId = brands[0];
    }
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (id: string, params: Record<string, any>) => {
  const response = await VendorService.getProducts(id, params);
  return response?.data?.data || [];
};

export const getCount = async (id: string, params: Record<string, any>) => {
  const p = { ...params };

  delete p.page;
  delete p.limit;
  delete p.sort;

  const response = await VendorService.getProductsCount(id, params);
  return response?.data?.count || 0;
};
