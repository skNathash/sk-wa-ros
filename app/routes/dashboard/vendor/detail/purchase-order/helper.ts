import { endOfDay, startOfDay } from "date-fns";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const defaultSummary = [
  {
    label: "Total PO Value",
    key: "totalPoValue",
    icon: "indian-rupee",
    value: 0,
    color: "primary",
  },
  {
    label: "Pending Orders",
    key: "pendingOrders",
    icon: "hourglass",
    value: 0,
    color: "warning",
  },
  {
    label: "Received Today",
    key: "receivedToday",
    icon: "calendar",
    value: 0,
    color: "success",
  },
  {
    label: "Total PO",
    key: "totalPo",
    icon: "truck",
    value: 0,
    color: "info",
  },
];

export const prepareFilterParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: SortProps
) => {
  const params: any = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {},
  };

  // Sorting logic
  if (sort && sort.key && sort.value) {
    params.sort = {
      [sort.key]: sort.value === "asc" ? 1 : -1,
    };
  }

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.$or = [
      { orderId: filter.search.trim() },
      { "vendorInfo.name": { $regex: filter.search.trim(), $options: "i" } },
    ];
  }

  // Add date range filter
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  if (filter.vendorId) {
    params.filter["vendorInfo.id"] = filter.vendorId;
  }

  // Status logic
  if (filter.status && filter.status !== "All") {
    const found = PurchaseOrderService.getStatuses().find(
      (x) => x.value === filter.status
    )?.status;
    if (found) params.filter.status = { $in: found };
  }

  if (filter.feature === "receive") {
    const statuses = PurchaseOrderService.getStatuses().find(
      (x) => x.value === "Approved"
    )?.status;
    if (statuses) {
      params.filter.status = { $in: statuses };
    }
  }

  return params;
};

// Get purchase orders data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await PurchaseOrderService.getList(params);
    const data = response.data?.data;
    if (response.statusCode === 200 && Array.isArray(data)) {
      return data.map((e) => PurchaseOrderService.formatPurchaseOrderData(e));
    }
    return [];
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
};

// Get purchase orders count from API
export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await PurchaseOrderService.getCount(params);
    if (response.statusCode === 200) {
      return response.data?.count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching purchase orders count:", error);
    return 0;
  }
};

export const getSummary = async (filter: Record<string, any>) => {
  const defaultFilter = { ...filter };

  const pendingFilter = {
    ...filter,
    status: "yetToReceive",
  };

  const receivedTodayFilter = {
    ...filter,
    dateRange: [new Date(), new Date()],
    status: "received",
  };

  try {
    const promises = [
      getCount(prepareFilterParams(defaultFilter)),
      getCount(prepareFilterParams(receivedTodayFilter)),
      getCount(prepareFilterParams(pendingFilter)),
      getCount(prepareFilterParams(defaultFilter)),
    ];
    const [totalPoValue, receivedToday, pendingOrders, totalPo] =
      await Promise.all(promises);
    return { totalPoValue, receivedToday, pendingOrders, totalPo };
  } catch (error) {
    console.error("Error fetching purchase orders summary:", error);
    return [];
  }
};
