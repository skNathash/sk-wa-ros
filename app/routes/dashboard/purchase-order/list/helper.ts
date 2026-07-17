import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PaginationState } from "~/types/CommonTypes";

export const defaultSummary = [
  {
    label: "totalPOValue", // Translation key
    key: "totalPoValue",
    icon: "indian-rupee",
    value: 0,
    color: "primary", // financial/total value
  },
  {
    label: "yetToReceive", // Translation key
    key: "pendingOrders",
    icon: "hourglass",
    value: 0,
    color: "warning", // pending
  },
  {
    label: "receivedToday", // Translation key
    key: "receivedToday",
    icon: "calendar",
    value: 0,
    color: "success", // received/completed
  },
  {
    label: "totalPO", // Translation key
    key: "totalPo",
    icon: "truck",
    value: 0,
    color: "info", // total count/info
  },
];

export const prepareFilterParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: { key: string; value: "asc" | "desc" | undefined }
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

  if (
    filter.receivedDateRange &&
    Array.isArray(filter.receivedDateRange) &&
    filter.receivedDateRange.length === 2
  ) {
    params.filter.receiptConfirmedAt = {
      $gte: startOfDay(filter.receivedDateRange[0]).toISOString(),
      $lte: endOfDay(filter.receivedDateRange[1]).toISOString(),
    };
  }

  // Overwrite status based on activeTab
  if (filter.activeTab === "receive-orders") {
    const statuses = PurchaseOrderService.getStatuses().find(
      (x) => x.value === "yetToReceive"
    )?.status;
    if (statuses) {
      params.filter.status = { $in: statuses };
    }
  } else if (filter.activeTab === "draft-orders") {
    const statuses = PurchaseOrderService.getStatuses().find(
      (x) => x.value === "draft"
    )?.status;
    if (statuses) {
      params.filter.status = { $in: statuses };
    }
  } else if (filter.activeTab === "rejected-orders") {
    const statuses = PurchaseOrderService.getStatuses().find(
      (x) => x.value === "rejected"
    )?.status;
    if (statuses) {
      params.filter.status = { $in: statuses };
    }
  } else if (filter.status && filter.status !== "All") {
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

  // Source filter
  if (filter.source && filter.source !== "All") {
    // The API stores source as `source` on the PO object
    params.filter.source = filter.source;
  }

  return params;
};

// Get purchase orders data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const r = await PurchaseOrderService.getPoPackages(
      AuthService.getLoggedInUserId() || ""
    );

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
// Get total purchase order amount from API
export const getTotalAmount = async (filter: Record<string, any>) => {
  try {
    const params = {
      ...prepareFilterParams(filter),
      groupbycond: "amount",
    };
    const response = await PurchaseOrderService.getCount(params);
    if (
      response.statusCode === 200 &&
      Array.isArray(response.data?.data) &&
      response.data.data.length > 0
    ) {
      return response.data.data[0].totalAmountSum || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching total purchase order amount:", error);
    return 0;
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
    receivedDateRange: [new Date(), new Date()],
    status: "received",
  };

  try {
    const promises = [
      getTotalAmount(defaultFilter),
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
