import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export interface FilterFormData {
  retailerId: string;
  search?: string;
  status?: string;
  dateRange?: Date[] | null;
  /** Restrict to orders with an outstanding payment. */
  paymentDue?: boolean;
}

export const defaultFilter: FilterFormData = {
  retailerId: "",
  search: "",
  status: "All",
  dateRange: null,
  paymentDue: false,
};

// Orders on this page are the ones exchanged between the logged-in user and
// the retailer being viewed — either side can be the seller.
const partyFilter = (): Record<string, any> => ({
  $or: [
    { "customerInfo.customerId": AuthService.getLoggedInUserId() },
    { "sellerInfo.franchiseId": AuthService.getLoggedInUserId() },
  ],
});

export const prepareParams = (
  filter: FilterFormData,
  pagination: PaginationState,
  sort?: { key: string; value: SortValue },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: partyFilter(),
  };

  if (filter.status && filter.status !== "All") {
    const statusOption = OmsService.getOrderStatuses().find(
      (s) => s.value === filter.status,
    );
    params.filter.status = { $in: statusOption?.statuses || [filter.status] };
  }

  const [from, to] = filter.dateRange || [];
  if (from || to) {
    params.filter.createdAt = {
      ...(from ? { $gte: new Date(from).toISOString() } : {}),
      ...(to ? { $lte: new Date(to).toISOString() } : {}),
    };
  }

  // TODO: payload pending — swap in the real payment-due condition once shared.
  if (filter.paymentDue) {
    // params.filter.<field> = <condition>;
  }

  const search = (filter.search || "").trim();
  if (search) {
    params.filter.orderRefNo = { $regex: search, $options: "i" };
  }

  // Sorting (if needed)
  if (sort?.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

/**
 * Everything the list rows paint, derived once here so the table/card markup
 * stays declarative: unit counts, the status sub-line (delivered date or ETA)
 * and the payment line under the total.
 */
const decorateOrder = (order: Record<string, any>) => {
  const items: Record<string, any>[] = Array.isArray(order.items)
    ? order.items
    : [];

  const units = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );

  const total = Number(
    order._payableAmt ?? order.totalAmount ?? order.orderAmount ?? 0,
  );

  const payments: Record<string, any>[] = Array.isArray(order.paymentMode)
    ? order.paymentMode
    : [];

  const paidAmount = payments
    .filter((payment) => payment.approvalStatus !== "Rejected")
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

  const dueAmount = Math.max(0, total - paidAmount);

  // The line under the status badge: when it landed, or when it is expected.
  let statusNote = "";
  let statusNoteDate: string | null = null;

  if (order.status === "Delivered") {
    statusNote = "Delivered";
    statusNoteDate = order.deliveredAt || order.updatedAt || null;
  } else if (order.expectedDeliveryDate) {
    statusNote = "ETA";
    statusNoteDate = order.expectedDeliveryDate;
  }

  // The line under the total: how it is being settled, and what is left.
  const paymentParts = [
    order._paymentStatusLbl || order.paymentStatus || "",
    order.isPaylaterOrder ? "Paylater" : order.paymentMethod || "",
  ].filter(Boolean);

  return {
    ...order,
    _itemsCount: items.length || order.itemsCount || 0,
    _units: units,
    _total: total,
    _paidAmount: paidAmount,
    _dueAmount: dueAmount,
    _hasDue: dueAmount > 0,
    _statusNote: statusNote,
    _statusNoteDate: statusNoteDate,
    _paymentLine: paymentParts.join(" · "),
  };
};

export const getData = async (params: Record<string, any>, fid?: string) => {
  const fidToUse = fid || "";
  const response = await OmsService.getSalesOrders(fidToUse, params);

  const orders = Array.isArray(response?.data?.data)
    ? response?.data?.data
    : [];

  return OmsService.formatOrderResponse(orders).map(decorateOrder);
};

export const getCount = async (params: Record<string, any>, fid?: string) => {
  const countParams = { ...params, outputType: "count" };
  const fidToUse = fid || "";
  const response = await OmsService.getSalesOrders(fidToUse, countParams);

  const totalOrders = response?.data?.data || 0;
  const metrics = response?.data?.metrics || {};

  return {
    totalOrders: totalOrders || 0,
    totalRevenue: metrics.totalSalesValue || 0,
    avgOrderValue: metrics.avgOrderValue || 0,
    uniqueCustomers: metrics.uniqueCustomers || 0,
  };
};

export interface OrderSummary {
  orderCount: number;
  orderAmount: number;
  paidCount: number;
  paidAmount: number;
  paidPercentage: number;
  dueCount: number;
  dueAmount: number;
}

export const emptySummary: OrderSummary = {
  orderCount: 0,
  orderAmount: 0,
  paidCount: 0,
  paidAmount: 0,
  paidPercentage: 0,
  dueCount: 0,
  dueAmount: 0,
};

// Takes the same payload as the list (`prepareParams`) so the tiles always
// reflect the applied filters — paging and sorting mean nothing to an aggregate.
export const getSummary = async (
  sellerId: string,
  params: Record<string, any> = {},
): Promise<OrderSummary> => {
  const { page, count, sort, ...summaryParams } = params;
  const response = await OmsService.getOrderSummary(sellerId, summaryParams);
  const data = response?.data?.data || {};

  const { orderInfo = {}, paymentPaid = {}, paymentDue = {} } = data;

  return {
    orderCount: Number(orderInfo.orderCount) || 0,
    orderAmount: Number(orderInfo.orderAmount) || 0,
    paidCount: Number(paymentPaid.orderCount) || 0,
    paidAmount: Number(paymentPaid.amount) || 0,
    paidPercentage: Number(paymentPaid.paidPercentage) || 0,
    dueCount: Number(paymentDue.orderCount) || 0,
    dueAmount: Number(paymentDue.amount) || 0,
  };
};
