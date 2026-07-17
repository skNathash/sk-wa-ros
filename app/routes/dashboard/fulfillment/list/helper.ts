import AuthService from "~/services/AuthService";
import SellerService from "~/services/SellerService";
import type { PaginationState } from "~/types/CommonTypes";

const getData = async (params: Record<string, any>) => {
  const fid = AuthService.getLoggedInUserId() || "";
  const response = await SellerService.getSellerOrders(fid, params);
  return response?.data?.data || [];
};

const getCount = async (params: Record<string, any>) => {
  const p = { ...params };

  delete p.sort;
  delete p.page;
  delete p.limit;

  const fid = AuthService.getLoggedInUserId() || "";
  const response = await SellerService.getSellerOrders(fid, {
    ...p,
    outputType: "count",
  });
  return response?.data?.data || 0;
};

const prepareFilters = (
  filter: Record<string, any>,
  pagination: PaginationState,
  statusKey?: string
) => {
  let p: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    p.filter.$or = [
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "items.dealName": { $regex: search, $options: "i" } },
    ];
  }

  if (filter.type && filter.type !== "all") {
    p.filter.orderType = filter.type;
  }

  if (filter.routeId && filter.routeId !== "all") {
    p.filter["routeInfo.routeId"] = filter.routeId;
  }

  if (statusKey === "approval-pending") {
    p.sort = {
      orderedDate: -1,
    };
  }

  if (filter.status) {
    const statusesList = SellerService.getOrderStatuses();
    if (Array.isArray(filter.status)) {
      let allStatuses: string[] = [];
      for (const s of filter.status) {
        const statusObj = statusesList.find((status) => status.value === s);
        if (statusObj) {
          allStatuses = allStatuses.concat(statusObj.statuses);
        } else {
          allStatuses.push(s);
        }
      }
      p.filter.status = { $in: allStatuses };
    } else {
      const statusObj = statusesList.find(
        (status) => status.value === filter.status
      );
      if (statusObj) {
        p.filter.status = { $in: statusObj.statuses };
      } else {
        p.filter.status = filter.status;
      }
    }
  }

  return p;
};

/**
 * Get counts for each status key provided in the statusMap.
 * statusMap should be an object where keys are status keys and values
 * are either a single status string or an array of status strings.
 * Returns a mapping of statusKey -> count.
 */
const getCountsForStatusMap = async (
  statusMap: Record<string, string | string[]>,
  baseFilter: Record<string, any> = {}
): Promise<Record<string, number>> => {
  const entries = Object.entries(statusMap || {});

  // Build params for each statusKey using prepareFilters and fetch counts in parallel
  const promises = entries.map(([statusKey, statusValue]) => {
    const filterForStatus = { ...baseFilter, status: statusValue };
    const params = prepareFilters(
      filterForStatus,
      {
        activePage: 1,
        rowsPerPage: 1,
        endSlNo: 1,
        startSlNo: 1,
        totalRecords: 0,
      },
      statusKey
    );
    return getCount(params).then((count) => ({ statusKey, count }));
  });

  const results = await Promise.all(promises);
  const counts: Record<string, number> = {};
  for (const r of results) {
    counts[r.statusKey] = r.count || 0;
  }

  return counts;
};

export { getCount, getData, prepareFilters, getCountsForStatusMap };
