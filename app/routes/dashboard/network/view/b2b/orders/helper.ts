import { endOfDay, startOfDay, sub } from "date-fns";
import AuthService from "~/services/AuthService";
import SellerService from "~/services/SellerService";
import OmsService from "~/services/OmsService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export const defaultSummary = [
  {
    label: "Total B2B Orders",
    icon: "shopping-cart",
    value: 0,
    color: "primary",
  },
  {
    label: "Total Revenue",
    icon: "indian-rupee",
    value: 0,
    color: "success",
  },
  {
    label: "Avg Order Value",
    icon: "indian-rupee",
    value: 0,
    color: "primary",
  },
  {
    label: "Unique Customers",
    icon: "users",
    value: 0,
    color: "warning",
  },
];

export const defaultFilter = {
  dateRange: [sub(new Date(), { days: 30 }), new Date()],
  search: "",
  status: "",
  routeId: "all",
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: SortValue },
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  // Customer ID filter
  if (filter.customerId) {
    params.filter["customerInfo.customerId"] = filter.customerId;
  }

  // Search
  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.mobile": { $regex: search, $options: "i" } },
    ];
  }

  // Status
  if (filter.status && filter.status !== "all") {
    const statusOption = SellerService.getOrderStatuses().find(
      (option) => option.value === filter.status,
    );
    if (statusOption && statusOption.statuses) {
      params.filter.status = { $in: statusOption.statuses };
    }
  }

  // Date Range
  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.orderedDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  // Route selection
  if (filter.routeId && filter.routeId !== "all") {
    params.filter["routeInfo.routeId"] = filter.routeId;
  }

  // Sorting
  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params,
  );
  const orders = response?.data?.data || [];
  return OmsService.formatOrderResponse(orders);
};

export const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    countParams,
  );
  return response?.data?.data || 0;
};
