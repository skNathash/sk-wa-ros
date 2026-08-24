import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import type { PaginationState, VariantColor } from "~/types/CommonTypes";

/** The tab's filter bar, straight off the react-hook-form values. */
export interface ByOrderFilter extends Record<string, any> {
  search: string;
}

/** One line item, surfaced in the bubble's message body. */
export interface ByOrderItem {
  dealName?: string;
  quantity?: number;
  status?: string;
  weight?: number;
  netWeight?: number;
}

/**
 * One order shown as a chat bubble — a `deliveryAgent`-carried shipment, so
 * the bubble is the order plus everything the customer needs to know about it.
 */
export interface ByOrder extends Record<string, any> {
  orderId: string;
  orderRefNo?: string;
  orderType?: string;
  orderSubType?: string;
  status?: string;
  paymentType?: string;
  payableAmount?: number;
  orderedDate?: string;
  deliveryDistance?: number;
  customerInfo?: { name?: string; mobile?: string; address?: { town?: string } };
  items?: ByOrderItem[];
  /** Display fields derived once in {@link formatOrder}. */
  _initials: string;
  _runnerInitials: string;
  _statusColor: VariantColor;
  _statusLbl: string;
  _typeColor: VariantColor;
  _amountLbl: string;
  _paymentLbl: string;
  _itemsSummary: string;
  _moreItems: number;
  _locality: string;
  _itemCount: number;
  _weightLbl: string;
  _driverLbl: string;
  _etaLbl: string;
}

/**
 * Build the order query — paging plus the tab's search. Like the "By Runner"
 * tab this is a live-shipment view, so it stays on orders that have already
 * left the store with a runner (status "Shipped").
 */
export const prepareParams = (
  filter: ByOrderFilter,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      status: "Shipped",
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

  return params;
};

export async function getData(
  params: Record<string, any>,
): Promise<ByOrder[]> {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params,
  );

  const orders = OmsService.formatOrderResponse(response?.data?.data || []);
  return (orders || []).map(formatOrder);
}

export async function getCount(params: Record<string, any>): Promise<number> {
  const p: Record<string, any> = { ...params, outputType: "count" };

  delete p.page;
  delete p.limit;

  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    p,
  );
  return response?.data?.data || 0;
}

/** Derive everything a chat bubble renders so the component stays markup only. */
function formatOrder(order: Record<string, any>): ByOrder {
  const isCod = order.paymentType === "COD";

  const items: ByOrderItem[] = Array.isArray(order.items)
    ? order.items.filter(
        (i: any) => i?.status !== "Cancelled" && i?.status !== "Returned",
      )
    : [];

  // Only the first couple of lines read as a "message"; the rest collapse
  // into a "+N more" caption so the bubble stays short, like a WhatsApp note.
  const shown = items.slice(0, 2);
  const itemsSummary = shown
    .map((i) =>
      `${i.dealName || "Item"}`.concat(
        (i.quantity || 1) > 1 ? ` ×${i.quantity}` : "",
      ),
    )
    .join(", ");

  // Total item count + gross weight, so the card's meta line can read
  // "3 items · 0.9 kg" the same way the WhatsApp-style layout shows it.
  const itemCount = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  const weight = items.reduce(
    (sum, i) => sum + (Number(i.weight) || Number(i.netWeight) || 0),
    0,
  );

  return {
    ...order,
    orderId: order.orderId || order._id,
    _initials: CommonService.prepareInitials(order.customerInfo?.name),
    _runnerInitials: CommonService.prepareInitials(order.deliveryAgent?.name),
    _statusColor: order._statusColor || OmsService.getStatusColor(order.status),
    _statusLbl: order._statusLbl || OmsService.getStatusLabel(order.status),
    _typeColor: order._typeColor || OmsService.getOrderTypeColor(order.orderType),
    _amountLbl: `₹${CommonService.formattedAmount(order.payableAmount)}`,
    _paymentLbl: isCod ? "COD" : "Prepaid",
    _itemsSummary: itemsSummary,
    _moreItems: Math.max(0, items.length - shown.length),
    _locality: order.customerInfo?.address?.town || "",
    _itemCount: itemCount || items.length,
    _weightLbl: weight ? `${CommonService.roundedByDecimalPlace(weight, 2)} kg` : "",
    _driverLbl: [order.deliveryAgent?.name, order.vehicleNumber]
      .filter(Boolean)
      .join(" · "),
    _etaLbl: order._etaLbl || "ETA 5 min",
  } as ByOrder;
}
