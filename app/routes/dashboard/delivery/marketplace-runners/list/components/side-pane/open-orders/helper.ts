import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";

/** An order is waiting on a runner once it is invoiced and not yet shipped. */
const OPEN_ORDER_STATUS = "Invoiced";

const OPEN_ORDER_LIMIT = 100;

/** One order still waiting on a runner, as the pane's list renders it. */
export interface OpenOrder extends Record<string, any> {
  orderId: string;
  orderRefNo: string;
  /** Display fields derived once in {@link getOpenOrders}. */
  /** Trailing digits of the order ref, the badge on the left of the row. */
  _refLbl: string;
  /** "Kumbalgudu · 1.2 km" caption under the customer. */
  _dropLbl: string;
}

/**
 * The store's own orders that are invoiced and still without a runner, newest
 * first — the "My open orders needing runners" list at the foot of the pane.
 *
 * Mirrors the orders/list API integration: same sales-order endpoint, same
 * response unpacking and formatting via {@link OmsService.formatOrderResponse}.
 */
export async function getOpenOrders(): Promise<OpenOrder[]> {
  const params = {
    page: 1,
    limit: OPEN_ORDER_LIMIT,
    sort: { orderedDate: -1 },
    filter: { status: OPEN_ORDER_STATUS },
  };

  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params,
  );

  const orders = Array.isArray(response?.data?.data)
    ? response.data.data
    : [];

  return OmsService.formatOrderResponse(orders).map(formatOpenOrder);
}

/** Derive everything an open-order row renders. */
function formatOpenOrder(order: Record<string, any>): OpenOrder {
  const refNo = order.orderRefNo || "";
  const town = order.customerInfo?.address?.town || "";
  const rawDistance = order.deliveryDistance;
  const distance =
    typeof rawDistance === "number" && !Number.isNaN(rawDistance)
      ? CommonService.roundedByDecimalPlace(rawDistance, 1)
      : null;

  return {
    ...order,
    _refLbl: refNo.slice(-3),
    _dropLbl:
      town && distance !== null
        ? `${town} · ${distance} km`
        : town || (distance !== null ? `${distance} km` : ""),
  } as OpenOrder;
}

/** Narrow the open orders by the pane's search box — customer or order ref. */
export function filterOpenOrders(
  orders: OpenOrder[],
  search: string,
): OpenOrder[] {
  const term = search.trim().toLowerCase();
  if (!term) return orders;

  return orders.filter(
    (order) =>
      order.orderRefNo?.toLowerCase().includes(term) ||
      order.customerInfo?.name?.toLowerCase().includes(term) ||
      order.customerInfo?.address?.town?.toLowerCase().includes(term),
  );
}
