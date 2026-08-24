import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import SellerService from "~/services/SellerService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export const defaultSummary = [
  {
    label: "Total Orders",
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
  // No date window by default — the list opens on the customer's full purchase
  // history and only narrows once a range is actually picked in the filter.
  dateRange: [] as Date[],
  search: "",
  status: "",
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: SortValue }
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  // Customer ID filter (retailer id passed as route param)
  if (filter.customerId) {
    params.filter["customerInfo.customerId"] = filter.customerId;
  }

  // Search
  const search = filter.search?.trim();
  if (search) {
    // reuse common search pattern used in products list: expose as filter.search for backend
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
      (option) => option.value === filter.status
    );
    if (statusOption && statusOption.statuses) {
      params.filter.status = { $in: statusOption.statuses };
    }
  }

  // Date Range - normalize to ISO strings (start/end of day)
  if (
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2 &&
    filter.dateRange[0] &&
    filter.dateRange[1]
  ) {
    params.filter.orderedDate = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  // Sorting
  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await SellerService.getSellerOrders(
    AuthService.getLoggedInUserId() || "",
    params
  );
  const orders = response?.data?.data || [];
  return SellerService.formatOrderResponse(orders);
};

export const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  const response = await SellerService.getSellerOrders(
    AuthService.getLoggedInUserId() || "",
    countParams
  );
  return response?.data?.data || 0;
};
