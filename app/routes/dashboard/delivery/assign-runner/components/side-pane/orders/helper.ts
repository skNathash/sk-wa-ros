import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import type { PaginationState } from "~/types/CommonTypes";

/** One row of the "Assign next" list. */
export interface ReadyOrder {
  orderId: string;
  orderRefNo?: string;
  orderType?: string;
  payableAmount?: number;
  paymentType?: string;
  customerInfo?: {
    name?: string;
    mobile?: string;
  };
  deliveryDistance?: number;
  orderedDate?: string;
  status?: string;
  /** Display fields derived once in `getData`. */
  _initials?: string;
  _isCod?: boolean;
  /** "customer · locality · 1.2 km" caption under the order ref. */
  _meta?: string;
  /** "₹428" for COD, "prepaid" otherwise. */
  _amountLbl?: string;
}

/** The tabs the pane filters by; `all` applies no extra condition. */
export type OrderTabKey = "all" | "cod" | "nearby";

/**
 * Build the sales-order query for the pane. Mirrors the dispatch list — only
 * orders that are ready to leave the store (Invoiced / Pending Shipment) can
 * have a runner assigned to them.
 */
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    filter: {
      status: { $in: ["Invoiced", "Pending Shipment"] },
    },
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.mobile": { $regex: search, $options: "i" } },
    ];
  }

  if (filter.tab === "cod") {
    params.filter.paymentType = "COD";
  }

  return params;
};

export async function getData(params: Record<string, any>) {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params,
  );

  const orders = OmsService.formatOrderResponse(response?.data?.data || []);
  return orders.map(formatReadyOrder);
}

export async function getCount(params: Record<string, any>) {
  const p: Record<string, any> = { ...params, outputType: "count" };

  delete p.page;
  delete p.limit;
  delete p.sort;

  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    p,
  );
  return response?.data?.data || 0;
}

/**
 * Derive everything the card renders so the component stays markup only.
 */
function formatReadyOrder(order: any): ReadyOrder {
  const isCod = order.paymentType === "COD";
  const distance = order.deliveryDistance;

  return {
    ...order,
    _isCod: isCod,
    _initials: CommonService.prepareInitials(order.customerInfo?.name),
    _meta: [
      order.customerInfo?.name,
      order.customerInfo?.address?.town,
      typeof distance === "number" ? `${distance.toFixed(1)} km` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    _amountLbl: isCod
      ? `₹${CommonService.formattedAmount(order.payableAmount)}`
      : "prepaid",
  };
}

