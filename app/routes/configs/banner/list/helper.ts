import { endOfDay, startOfDay } from "date-fns";
import BannerService from "~/services/BannerService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  tab = "All",
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  if (filter?.search) {
    params.filter["$or"] = [
      { title: { $regex: filter.search, $options: "i" } },
      { placeholder: { $regex: filter.search, $options: "i" } },
      { _id: filter.search },
    ];
  }

  // isActive filter
  if (filter?.isActive && filter.isActive !== "all") {
    params.filter.isActive = filter.isActive === "true";
  }

  // validity date range filter (range picker: [from, to])
  if (filter?.validityDateRange?.[0]) {
    params.filter.validFrom = {
      ...params.filter.validFrom,
      $gte: startOfDay(new Date(filter.validityDateRange[0])).toISOString(),
    };
  }
  if (filter?.validityDateRange?.[1]) {
    params.filter.validTo = {
      ...params.filter.validTo,
      $lte: endOfDay(new Date(filter.validityDateRange[1])).toISOString(),
    };
  }

  // created on date range filter (range picker: [from, to])
  if (filter?.createdDateRange?.[0]) {
    params.filter.createdAt = {
      ...params.filter.createdAt,
      $gte: startOfDay(new Date(filter.createdDateRange[0])).toISOString(),
    };
  }
  if (filter?.createdDateRange?.[1]) {
    params.filter.createdAt = {
      ...params.filter.createdAt,
      $lte: endOfDay(new Date(filter.createdDateRange[1])).toISOString(),
    };
  }

  // type filter (skip if "All" or "Both")
  if (filter?.type && filter.type !== "All" && filter.type !== "Both") {
    params.filter.type = filter.type;
  }

  // status filter
  if (filter?.status && filter.status !== "all") {
    params.filter.status = filter.status;
  }

  const now = new Date().toISOString();
  if (tab === "Running") {
    params.filter.validFrom = { $lte: now };
    params.filter.validTo = { $gte: now };
    params.filter.status = "Approved";
    params.filter.isActive = true;
  } else if (tab === "Upcoming") {
    params.filter.validFrom = { $gt: now };
    params.filter.status = "Approved";
    params.filter.isActive = true;
  } else if (tab === "Expired") {
    params.filter.validTo = { $lt: now };
    params.filter.status = "Expired";
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await BannerService.list(params);
    const list = response.data?.data || [];
    return list.map((item: Record<string, any>) => ({
      ...item,
      _statusColor: BannerService.getStatusBadgeColor(item.status),
    }));
  } catch (err) {
    console.error("Error fetching banner configs:", err);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const p: Record<string, any> = { ...(params || {}), outputType: "count" };
    delete p.page;
    delete p.count;
    delete p.sort;

    const response = await BannerService.list(p);
    return response.data?.pagination?.totalItems || response.data?.count || 0;
  } catch (err) {
    console.error("Error fetching banner config count:", err);
    return 0;
  }
};
