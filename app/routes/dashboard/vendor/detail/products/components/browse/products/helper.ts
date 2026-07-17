import { endOfDay, startOfDay } from "date-fns";
import VendorService from "~/services/VendorService";
import type { PaginationState } from "~/types/CommonTypes";

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
    params.filter.name = search;
  }

  if (filter.category) {
    params.filter.categoryId = filter.category;
  }

  if (filter.brand) {
    params.filter.brandId = filter.brand;
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
