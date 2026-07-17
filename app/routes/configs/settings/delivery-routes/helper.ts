import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage ?? 1,
    limit: pagination.rowsPerPage ?? 10,
    filter: {},
  };

  const search = filter?.search?.trim();
  if (search) {
    params.filter.$or = [
      { description: { $regex: search, $options: "i" } },
      { areas: { $regex: search, $options: "i" } },
      { routeName: { $regex: search, $options: "i" } },
    ];
  }

  // Support `status` from filter: 'all' | 'active' | 'inactive'
  const status = filter?.status;
  if (status === "active") {
    params.filter.isActive = true;
  } else if (status === "inactive") {
    params.filter.isActive = false;
  } else if (typeof filter.isActive === "boolean") {
    // legacy support if caller uses boolean
    params.filter.isActive = filter.isActive;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await DeliveryRoutesService.getRoutesList(params);
    const list = response?.data?.data ?? response?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Error fetching delivery routes:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const p: Record<string, any> = { ...params, outputType: "count" };

    delete p.page;
    delete p.limit;

    const response = await DeliveryRoutesService.getRoutesList(p);
    return response?.data?.data?.count ?? 0;
  } catch (error) {
    return 0;
  }
};
