import { startOfDay, subDays } from "date-fns";
import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";

/**
 * One order row as the payment-approval pane blocks render it. Every display
 * field is derived here while the API response is normalised, so the list
 * components stay pure markup.
 */
export interface PaymentApprovalOrder {
  orderId: string;
  orderRefNo: string;
  customerName: string;
  customerMobile: string;
  amount: number;
  /** Ordered / last-updated stamp, whichever the row leads with. */
  date: string;
  /** "UPI · ₹1,200" style line describing what was paid and how. */
  paidVia: string;
  orderType: string;
}

/**
 * `from` value that carries the payment-approval context to the order detail
 * page — with it, that page's side pane shows the payment blocks instead of
 * the fulfilment stages, so verifying one order keeps the queue in view.
 */
export const PAYMENT_APPROVAL_FROM_PARAM = "payment-approval";

/** How many rows either block shows before it stops. */
export const PAYMENT_APPROVAL_ROW_LIMIT = 8;

/** How far back the "recently approved" block looks. */
export const PAYMENT_APPROVED_WINDOW_DAYS = 7;

const getPaymentModes = (order: any): any[] =>
  Array.isArray(order?.paymentMode) ? order.paymentMode : [];

/** The payment leg the row talks about — the one in the asked-for state. */
const describePayment = (order: any, approvalStatus: string) => {
  const modes = getPaymentModes(order);
  const mode =
    modes.find((m: any) => m?.approvalStatus === approvalStatus) || modes[0];
  if (!mode) return "";

  const label = mode.paidVia || mode.type || "";
  const amount = mode.amount ?? mode.paidAmount;
  if (label && amount != null) return `${label} · ₹${amount}`;
  return label || (amount != null ? `₹${amount}` : "");
};

/**
 * Reduces an already `OmsService.formatOrderResponse`-normalised order to the
 * handful of fields the pane rows render. Only the two things that format
 * doesn't cover are derived here: the customer label and the payment line.
 */
const toRow = (order: any, approvalStatus: string): PaymentApprovalOrder => ({
  orderId: order.orderId,
  orderRefNo: order.orderRefNo || order.orderId,
  customerName: order.customerInfo?.isGuestCustomer
    ? "Walk-in Customer"
    : order.customerInfo?.name || "-",
  customerMobile: order.customerInfo?.mobile || "",
  amount: order._payableAmt || 0,
  date: order.updatedAt || order.orderedDate || "",
  paidVia: describePayment(order, approvalStatus),
  orderType: order.orderType || "",
});

/** Fetches and runs the rows through the shared order formatter. */
const getOrders = async (params: Record<string, any>) => {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params,
  );
  return OmsService.formatOrderResponse(response?.data?.data);
};

/**
 * Orders whose payment is still waiting on the store — the same filter the
 * `payment-approval` tab lists, so the pane and the list never disagree.
 */
export const getPaymentPendingOrders = async (): Promise<
  PaymentApprovalOrder[]
> => {
  const orders = await getOrders({
    page: 1,
    count: PAYMENT_APPROVAL_ROW_LIMIT,
    filter: { "paymentMode.approvalStatus": "Pending" },
    sort: { orderedDate: -1 },
  });
  return orders.map((o: any) => toRow(o, "Pending"));
};

/** Payments approved in the last week, newest first. */
export const getRecentlyApprovedOrders = async (): Promise<
  PaymentApprovalOrder[]
> => {
  const orders = await getOrders({
    page: 1,
    count: PAYMENT_APPROVAL_ROW_LIMIT,
    filter: {
      "paymentMode.approvalStatus": "Approved",
      orderedDate: {
        $gte: startOfDay(subDays(new Date(), PAYMENT_APPROVED_WINDOW_DAYS)),
      },
    },
    sort: { orderedDate: -1 },
  });
  return orders.map((o: any) => toRow(o, "Approved"));
};
