import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

// Prepare params for API/data filtering (use same shape as orders list helper)
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      paymentMethod: "PAYLATER",
    },
  };

  // Search across common order fields (orderId, orderRefNo, customer name/mobile, items)
  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.mobile": { $regex: search, $options: "i" } },
      { "items.dealName": { $regex: search, $options: "i" } },
    ];
  }

  // Type filter (B2B/B2C)
  if (filter.type && filter.type !== "All") {
    params.filter.orderType = filter.type;
  }

  // Date Range
  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.orderedDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  // Status
  if (filter.status && filter.status !== "All") {
    const statusOption = OmsService.getOrderStatuses().find(
      (option) => option.value === filter.status
    );
    if (statusOption && statusOption.statuses) {
      params.filter.status = { $in: statusOption.statuses };
    }
  }

  // Sorting
  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

// Fetch data using same OmsService APIs as orders list helper
export const getData = async (params: Record<string, any>) => {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params
  );
  const orders = Array.isArray(response?.data?.data)
    ? response?.data?.data
    : [];
  return OmsService.formatOrderResponse(orders);
};

export const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    countParams
  );

  const totalOrders = response?.data?.data || 0;
  const metrics = response?.data?.metrics || {};

  return {
    totalOrders: totalOrders || 0,
    totalRevenue: metrics.totalSalesValue || 0,
    avgOrderValue: metrics.avgOrderValue || 0,
    uniqueCustomers: metrics.uniqueCustomers || 0,
  };
};
