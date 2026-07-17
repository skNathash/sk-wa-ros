import { endOfDay, startOfDay, sub, format } from "date-fns";
import { IndianRupee, ShoppingCart, Users } from "lucide-react";
import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import type { OrderTabsType } from "../components/tabs/OrderTabs";

export interface FilterFormData {
  search: string;
  dateRange: Date[];
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  orderSubType?: string;
  type: OrderTabsType;
  routeId?: string;
}

export const defaultSummary = [
  {
    label: "totalOrders",
    icon: ShoppingCart,
    value: 0,
    color: "primary",
    valueKey: "totalOrders",
    isAmount: false,
  },
  {
    label: "totalRevenue",
    icon: IndianRupee,
    value: 0,
    color: "success",
    valueKey: "totalRevenue",
    isAmount: true,
  },
  {
    label: "avgOrderValue",
    icon: IndianRupee,
    value: 0,
    color: "primary",
    valueKey: "avgOrderValue",
    isAmount: true,
  },
  {
    label: "uniqueCustomers",
    icon: Users,
    value: 0,
    color: "warning",
    valueKey: "uniqueCustomers",
    isAmount: false,
  },
];

export const defaultFilter = {
  // dateRange: [sub(new Date(), { days: 30 }), new Date()],
  dateRange: [],
  search: "",
  status: "all",
  paymentMethod: "all",
  paymentStatus: "all",
  orderSubType: "all",
  routeId: "all",
};

/**
 * Prepares query parameters from filter form data
 * @param formData - The filter form data
 * @param currentTab - Optional current tab to preserve in params
 * @returns Object with query parameters ready for URL search params
 */
export const prepareFilterQueryParams = (
  formData: FilterFormData,
  currentTab?: string | null,
): Record<string, any> => {
  const dateFrom = formData.dateRange?.[0]
    ? format(formData.dateRange[0], "yyyy-MM-dd")
    : "";
  const dateTo = formData.dateRange?.[1]
    ? format(formData.dateRange[1], "yyyy-MM-dd")
    : "";

  const params: Record<string, any> = {
    search: formData.search || "",
    status: formData.status || "all",
    paymentMethod: formData.paymentMethod || "all",
    paymentStatus: formData.paymentStatus || "all",
    orderSubType: formData.orderSubType || "all",
    dateFrom,
    dateTo,
  };

  // Preserve the 'tab' query parameter if it exists
  if (currentTab) {
    params.tab = currentTab;
  }

  return params;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: SortValue },
) => {
  // Unified logic for all order types, using DesktopView.tsx data binding keys
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  // Search
  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.mobile": { $regex: search, $options: "i" } },
      { "items.dealName": { $regex: search, $options: "i" } },
      { "discountInfo.breakup.code": { $regex: search, $options: "i" } },
    ];
  }

  // Status
  if (filter.status && filter.status !== "all") {
    const statusOption = OmsService.getOrderStatuses().find(
      (option) => option.value === filter.status,
    );
    if (statusOption && statusOption.statuses) {
      params.filter.status = { $in: statusOption.statuses };
    }
  }

  if (filter.type && filter.type !== "all-orders") {
    if (filter.type === "b2b-orders") {
      params.filter.orderType = "B2B";
    } else if (filter.type === "b2c-orders") {
      params.filter.orderType = "B2C";
    } else if (filter.type === "coinstore-orders") {
      // Coin Store orders are represented via orderSubType = COINSTORE
      params.filter.orderSubType = "COINSTORE";
    } else if (filter.type === "unconfirmed-orders") {
      params.filter.status = "Pending";
      params.filter.isReserveOrder = true;
    }
  }

  // Date Range
  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.orderedDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  // Payment method (order type like PAYLATER / COD)
  if (filter.paymentMethod && filter.paymentMethod !== "all") {
    params.filter.paymentMethod = filter.paymentMethod;
  }

  // If current tab is Payment Approval, always filter by approvalStatus = Pending
  if (filter.type && filter.type === "payment-approval") {
    params.filter["paymentMode.approvalStatus"] = "Pending";
  }

  // If current tab is Pending Settlement, filter by refundSettlement.status = Pending
  if (filter.type && filter.type === "pending-settlement") {
    params.filter["refundSettlements.status"] = "Pending";
  }

  // Payment status (Paid / Unpaid / Approval Pending / Rejected)
  if (filter.paymentStatus && filter.paymentStatus !== "all") {
    if (filter.paymentStatus === "Approval Pending") {
      params.filter["paymentMode.approvalStatus"] = "Pending";
    } else if (filter.paymentStatus === "Rejected") {
      params.filter["paymentMode.approvalStatus"] = "Rejected";
    } else {
      // for Paid / Unpaid use the paymentStatus field on order
      params.filter.paymentStatus = filter.paymentStatus;
    }
  }

  // Route selection
  if (filter.routeId && filter.routeId !== "all") {
    params.filter["routeInfo.routeId"] = filter.routeId;
  }

  // Order Sub Type (e.g., COINSTORE)
  if (filter.orderSubType && filter.orderSubType !== "all") {
    if (filter.orderSubType === "WALKIN") {
      params.filter["customerInfo.isGuestCustomer"] = true;
    } else if (filter.orderSubType === "RESERVE") {
      params.filter.isReserveOrder = true;
    } else if (filter.orderSubType === "ASSISTED") {
      params.filter.assistedOrder = true;
    } else if (filter.orderSubType === "QUICKCHECKOUT") {
      params.filter.quickCheckout = true;
    } else {
      params.filter.orderSubType = filter.orderSubType;
    }
  }

  // Sorting
  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  // Remove filter if empty
  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }
  return params;
};

export const getData = async (
  params: Record<string, any>,
  type: OrderTabsType,
) => {
  if (type === "my-orders") {
    const response = await OmsService.getMyOrders(params);
    const orders = response?.data?.data || [];
    return OmsService.formatOrderResponse(orders);
  }

  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params,
  );
  const orders = Array.isArray(response?.data?.data)
    ? response?.data?.data
    : [];
  return OmsService.formatOrderResponse(orders);
};

export const getCount = async (
  params: Record<string, any>,
  type: OrderTabsType,
) => {
  if (type === "my-orders") {
    // Use the same API as getData, but with outputType=count
    const countParams = { ...params, outputType: "count" };
    const response = await OmsService.getMyOrders(countParams);
    return { totalOrders: response?.data?.data || 0 };
  }

  // Use the same API as getData, but with outputType=count
  const countParams = { ...params, outputType: "count" };
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    countParams,
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
