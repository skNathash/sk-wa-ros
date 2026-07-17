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

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.alpha) {
    params.filter.alphabetical = filter.alpha;
  }

  if (filter.status === "Active") {
    params.filter.isActive = true;
  } else if (filter.status === "Inactive") {
    params.filter.isActive = false;
  }

  if (filter.type && filter.type !== "All") {
    params.filter.position = filter.type;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (id: string, params: Record<string, any>) => {
  const response = await VendorService.getBrands(id, params);
  return response?.data?.data?.sourceableBrands || [];
};

export const getCount = async (id: string, params: Record<string, any>) => {
  const p = { ...params };

  delete p.page;
  delete p.limit;
  delete p.sort;

  const response = await VendorService.getBrands(id, p);
  // Vendor brands endpoint may return grouped counts in totalGroups
  return response?.data?.totalGroups || response?.data?.count || 0;
};
