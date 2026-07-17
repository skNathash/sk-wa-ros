import { startOfDay, endOfDay } from "date-fns";
import type { PaginationState } from "~/types/CommonTypes";
import SellerService from "~/services/SellerService";

// Prepare params for API/data filtering
export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: { key: string; value: "asc" | "desc" },
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {},
  };

  if (filter.viewBy === "user") {
    params.groupbycond = "shipmentUserId";
  }

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      {
        orderRefId: {
          $regex: search,
          $options: "i",
        },
      },
      {
        "shipmentUserInfo.name": {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    const [start, end] = filter.dateRange;
    const gte = startOfDay(start);
    const lte = endOfDay(end);

    if (filter.activeTab === "handedover") {
      // For handed over, filter by settledOn
      params.filter.settledOn = {
        $gte: gte,
        $lte: lte,
      };
    } else {
      // For other tabs, filter by orderDate
      params.filter.orderDate = {
        $gte: gte,
        $lte: lte,
      };
    }
  }

  if (filter.status && filter.status !== "All") {
    // params.filter.status = filter.status;
  }

  if (filter.activeTab === "pending") {
    params.filter.status = "SettlementInitiated";
  } else if (filter.activeTab === "handedover") {
    params.filter.status = "Settled";
  }

  // if (!Object.keys(params.filter).length) {
  //   delete params.filter;
  // }

  return params;
};

function getInitial(name: string) {
  const trimmed = (name || "").trim();
  if (!trimmed || trimmed === "-") return "?";
  return trimmed.charAt(0).toUpperCase();
}

function formatGroupedByUserResponse(groups: any[]) {
  return (groups || []).map((group: any) => ({
    id: group._id,
    shipmentUserId: group._id,
    shipmentUserName: group.shipmentUserName,
    shipmentUserInfo: group.shipmentUserInfo,
    initial: getInitial(group.shipmentUserInfo?.name || group.shipmentUserName),
    refId: group.shipmentUserInfo?.refId,
    count: group.count,
    totalAmount: group.totalAmount,
    avgAmount: group.avgAmount,
    minAmount: group.minAmount,
    maxAmount: group.maxAmount,
    statuses: group.statuses,
    paymentModes: group.paymentModes,
    paymentTypes: group.paymentTypes,
    latestCreated: group.latestCreated,
    oldestCreated: group.oldestCreated,
  }));
}

export async function getData(params: Record<string, any>) {
  const response = await SellerService.getSettlements(params);

  if (params.groupbycond === "shipmentUserId") {
    return formatGroupedByUserResponse(response?.data?.data?.groups || []);
  }

  return SellerService.formatSettlementsResponse(response?.data?.data || []);
}

// Returns a promise that resolves to the count of filtered sample orders
export async function getCount(params: Record<string, any>) {
  const p: Record<string, any> = { ...params };

  if (p.groupbycond !== "shipmentUserId") {
    p.outputType = "count";
  }

  delete p.page;
  delete p.limit;

  const response = await SellerService.getSettlements(p);

  if (p.groupbycond === "shipmentUserId") {
    const totalGroups = response?.data?.data?.summary?.totalGroups || 0;
    return { count: totalGroups, value: totalGroups };
  }

  return response?.data?.data || { count: 0, value: 0 };
}

export async function getSummary(filters: Record<string, any>) {
  const defaultFilter = {
    ...filters,
  };

  const promises = [
    getCount(prepareParams({ ...defaultFilter, activeTab: "pending" })),
    getCount(prepareParams({ ...defaultFilter, activeTab: "handedover" })),
  ];

  const [initiated, settled] = await Promise.all(promises);

  return {
    initiated: initiated.totalAmount || 0,
    settled: settled.totalAmount || 0,
  };
}
