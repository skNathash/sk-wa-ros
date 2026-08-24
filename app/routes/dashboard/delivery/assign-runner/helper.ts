import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";

/**
 * The picked order, with the few display strings the runner desk shows derived
 * once here so the card stays markup only.
 */
export interface AssignRunnerOrder extends Record<string, any> {
  _id: string;
  orderRefNo: string;
  orderType: string;
  /** Invoice the shipment is assigned against — the assign call needs it. */
  _invoiceId: string;
  _initials: string;
  /** "BEML Rd · 0.8 km · 14 items · packed 9:32 AM" caption under the name. */
  _meta: string;
  _isCod: boolean;
  /** COD rupees to collect, formatted. */
  _codAmountLbl: string;
}

/**
 * Full detail of the order picked in the query string. Same call the order
 * view page runs (`sales/order/:id`), formatted through the shared order
 * formatter so amounts and status labels read the same everywhere.
 */
export async function getOrderDetail(
  orderId: string,
): Promise<AssignRunnerOrder | null> {
  const response = await OmsService.getSellerOrderDetail(orderId);
  const order = response?.data?.data;

  if (!order?._id) return null;

  return formatOrder(OmsService.formatOrderResponse([order])[0]);
}

function formatOrder(order: Record<string, any>): AssignRunnerOrder {
  const invoice = order.invoices?.[0];
  const address = order.customerInfo?.address;

  return {
    ...order,
    _invoiceId: invoice?.id,
    _initials: CommonService.prepareInitials(order.customerInfo?.name),
    _meta: [
      `#${order.orderRefNo}`,
      [address?.town, address?.district].filter(Boolean).join(", "),
      typeof order.deliveryDistance === "number"
        ? `${CommonService.roundedByDecimalPlace(order.deliveryDistance, 1)} km`
        : "",
      order.items?.length ? `${order.items.length} items` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    _isCod: order.paymentType === "COD",
    _codAmountLbl: `₹${CommonService.formattedAmount(order._payableAmt)}`,
  } as AssignRunnerOrder;
}
