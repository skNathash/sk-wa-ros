import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import type { VariantColor } from "~/types/CommonTypes";

/**
 * The order, flattened into exactly what the detail modal paints. Everything
 * the UI needs is derived here — the JSX only reads fields.
 */
export interface OrderDetailStep {
  key: string;
  label: string;
  state: "done" | "current" | "todo";
  index: number;
}

export interface OrderDetailItem {
  key: string;
  name: string;
  /** Brand · pack, e.g. "Fortune · 12 × 1L". Empty when neither is known. */
  meta: string;
  imageId?: string;
  price: number;
  qty: number;
  qtyLabel: string;
  amount: number;
  statusLbl?: string;
  statusColor?: VariantColor;
  isCancelled: boolean;
}

export interface OrderDetailPayment {
  key: string;
  type: string;
  via: string;
  refNo: string;
  amount: number;
}

export interface OrderDetailActivity {
  key: string;
  title: string;
  subtitle: string;
  at: string;
  tone: VariantColor;
  /**
   * Newest entry (logs arrive oldest-first). Gets the accent dot and ends the
   * timeline's connector.
   */
  isLatest: boolean;
}

/**
 * The stage accent driving the whole sheet's colour. Set once as an
 * `od-accent-*` class on the shell; every child reads it from there.
 */
export type OrderDetailAccent =
  | "placed"
  | "progress"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderDetailView {
  id: string;
  refNo: string;
  status: string;
  statusLbl: string;
  statusColor: VariantColor;
  orderType: string;
  typeColor: VariantColor;
  placedOn: string;
  /** "to" when we are buying, "from" when we are the seller. */
  partyLabel: string;
  partyName: string;
  isMyOrder: boolean;

  accent: OrderDetailAccent;
  /** Short "where is it right now" line under the ref no. */
  stageNote: string;

  steps: OrderDetailStep[];
  showSteps: boolean;

  itemCount: number;
  unitCount: number;

  subTotal: number;
  savings: number;
  shippingCharges: number;
  discount: number;
  coinsRedeemedValue: number;
  total: number;

  paymentTitle: string;
  paymentStatusLbl: string;
  paymentStatusColor: VariantColor;
  paidAmount: number;
  dueAmount: number;
  paidPercentage: number;
  isSettled: boolean;
  isPaylater: boolean;
  payments: OrderDetailPayment[];

  deliveryAddress: string;
  contactName: string;
  contactMobile: string;
  deliveredOn: string;
  note: string;

  items: OrderDetailItem[];
  activity: OrderDetailActivity[];

  invoiceDocumentId: string;
  orderLink: string;
}

/**
 * The stages the modal shows. Deliberately coarser than the full order-view
 * stepper — this is the minimal read of "where is my order".
 */
const STEPS: { key: string; label: string; statuses: string[] }[] = [
  { key: "placed", label: "Placed", statuses: ["Pending"] },
  {
    key: "confirmed",
    label: "Confirmed",
    statuses: [
      "Created",
      "Approved",
      "Picking",
      "Packing",
      "Packed",
      "Invoiced",
      "Pending Shipment",
    ],
  },
  { key: "dispatched", label: "Dispatched", statuses: ["Shipped"] },
  { key: "delivered", label: "Delivered", statuses: ["Delivered"] },
  { key: "settled", label: "Settled", statuses: [] },
];

const buildSteps = (status: string, isSettled: boolean): OrderDetailStep[] => {
  let currentIdx = STEPS.findIndex((s) => s.statuses.includes(status));

  // "Settled" has no order status of its own — it is Delivered plus nothing
  // left to pay.
  if (currentIdx === STEPS.length - 2 && isSettled) {
    currentIdx = STEPS.length - 1;
  }

  return STEPS.map((step, index) => ({
    key: step.key,
    label: step.label,
    index,
    state:
      index < currentIdx
        ? "done"
        : index === currentIdx
          ? currentIdx === STEPS.length - 1 || status === "Delivered"
            ? "done"
            : "current"
          : "todo",
  }));
};

/**
 * Status → sheet accent and the one-line "where is it" note. Deliberately
 * coarse: five moods, matching the five step keys.
 */
const buildStage = (
  status: string,
  isMyOrder: boolean,
): { accent: OrderDetailAccent; stageNote: string } => {
  const who = isMyOrder ? "the customer" : "you";

  switch (status) {
    case "Cancelled":
      return { accent: "cancelled", stageNote: "This order was cancelled" };
    case "Returned":
      return { accent: "cancelled", stageNote: "This order came back" };
    case "Delivered":
    case "Partially Delivered":
      return { accent: "delivered", stageNote: `Handed over to ${who}` };
    case "Shipped":
    case "Seller Shipped":
    case "Partially Shipped":
    case "Pending Shipment":
      return { accent: "shipped", stageNote: "On its way" };
    case "Pending":
      return { accent: "placed", stageNote: "Waiting to be confirmed" };
    case "Picking":
    case "Packing":
    case "Packed":
    case "Invoiced":
      return { accent: "progress", stageNote: "Being prepared" };
    default:
      return { accent: "progress", stageNote: "Confirmed and in progress" };
  }
};

const buildAddress = (address: Record<string, any> | undefined) => {
  if (!address) return "";
  return [
    address.name,
    address.doorNo,
    address.street,
    address.landmark,
    address.city || address.town,
    address.district,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");
};

const activityTone = (status: string): VariantColor => {
  const color = OmsService.getStatusColor(status || "");
  return (color || "secondary") as VariantColor;
};

const packMeta = (item: Record<string, any>) => {
  const parts: string[] = [];
  if (item.brandName) parts.push(item.brandName);
  if (item.packSoldQty > 0 && item.packQuantity) {
    parts.push(`${item.packSoldQty} × ${item.packQuantity}`);
  } else if (item.dealRefId) {
    parts.push(`ID ${item.dealRefId}`);
  }
  return parts.join(" · ");
};

/**
 * Fetches one order and reduces it to the modal's view model. Uses the same
 * endpoint + formatter as the full order view page, so every derived flag
 * (`_statusLbl`, `_payableAmt`, `isMyOrder`, …) means the same thing here.
 */
export const getOrderDetail = async (
  orderId: string,
): Promise<OrderDetailView | null> => {
  const response = await OmsService.getSellerOrderDetail(orderId);
  const raw = response?.data?.data;

  if (!raw || !raw._id) return null;

  const order = OmsService.formatOrderResponse([raw])[0];
  const summary = OmsService.prepareOrderSummary({ ...order }) || order;

  const items: Record<string, any>[] = Array.isArray(order.items)
    ? order.items
    : [];

  const liveItems = items.filter(
    (item) => item.status !== "Cancelled" && item.status !== "Returned",
  );

  const unitCount = liveItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );

  const paymentModes: Record<string, any>[] = Array.isArray(order.paymentMode)
    ? order.paymentMode
    : [];

  const paidAmount = paymentModes
    .filter((payment) => payment.approvalStatus !== "Rejected")
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

  const total = Number(order._payableAmt) || 0;
  const dueAmount = Math.max(0, total - paidAmount);

  const logs: Record<string, any>[] = Array.isArray(order.logs)
    ? order.logs
    : [];

  const deliveredLog = logs.find((log) => log.status === "Delivered");

  const shippingCharges = Number(order.shippingCharges) || 0;

  const status = order.status || "";
  const stage = buildStage(status, !!order.isMyOrder);

  return {
    id: order._id,
    refNo: order.orderRefNo || "",
    status: order.status || "",
    statusLbl: order._statusLbl || order.status || "",
    statusColor: (order._statusColor || "secondary") as VariantColor,
    orderType: order.orderType || "",
    typeColor: (order._typeColor || "light") as VariantColor,
    placedOn: order.createdAt || "",
    partyLabel: order.isMyOrder ? "from" : "to",
    partyName: order.isMyOrder
      ? order.customerInfo?.name || ""
      : order.sellerInfo?.franchiseName || order.sellerInfo?.name || "",
    isMyOrder: !!order.isMyOrder,

    accent: stage.accent,
    stageNote: stage.stageNote,

    steps: buildSteps(status, dueAmount <= 0),
    showSteps: !["Cancelled", "Returned"].includes(status),

    itemCount: liveItems.length,
    unitCount,

    subTotal: Number(summary._totalPrice) || 0,
    savings: Number(summary._itemSavings) || 0,
    shippingCharges,
    discount: Number(order.discount) || 0,
    coinsRedeemedValue: Number(order.coinsRedeemedValue) || 0,
    total,

    paymentTitle: order.isKcStore
      ? "Coinstore"
      : order.isPaylaterOrder
        ? "Paylater Wallet"
        : order.paymentType || order.paymentMethod || "—",
    paymentStatusLbl: order._paymentStatusLbl || "",
    paymentStatusColor: (order._paymentStatusColor ||
      "secondary") as VariantColor,
    paidAmount,
    dueAmount,
    paidPercentage: total > 0 ? Math.min(100, (paidAmount / total) * 100) : 0,
    isSettled: dueAmount <= 0,
    isPaylater: !!order.isPaylaterOrder,
    payments: paymentModes.map((payment, index) => ({
      key: `${payment.refNo || payment.type || "pay"}-${index}`,
      type: payment.type || payment.paymentMethod || "Payment",
      via: payment.paidVia || "",
      refNo: payment.refNo || "",
      amount: Number(payment.amount) || 0,
    })),

    deliveryAddress: buildAddress(order.shippingAddress),
    contactName: order.customerInfo?.name || order.shippingAddress?.name || "",
    contactMobile:
      order.customerInfo?.mobile ||
      order.shippingAddress?.mobile ||
      order.shippingAddress?.contact ||
      "",
    deliveredOn: deliveredLog?.createdAt || "",
    note: order.remarks || order.customerRemarks || "",

    items: items.map((item, index) => ({
      key: item._id || `${item.dealId}-${index}`,
      name: item.dealName || "—",
      meta: packMeta(item),
      imageId: item.images?.[0],
      price: Number(item.price) || 0,
      qty: Number(item.quantity) || 0,
      qtyLabel: item.selectedStockUom
        ? `${item.quantity} ${item.selectedStockUom}`
        : `${item.quantity}`,
      amount: Number(item.finalPrice) || 0,
      statusLbl: item._statusLbl,
      statusColor: item._statusColor as VariantColor,
      isCancelled: item.status === "Cancelled",
    })),

    activity: logs.map((log, index) => ({
      key: log._id || `${log.status}-${index}`,
      title: OmsService.getStatusLabel(log.status || "") || log.status || "",
      subtitle: [log.createdBy?.name, log.remarks].filter(Boolean).join(" · "),
      at: log.createdAt || "",
      tone: activityTone(log.status || ""),
      isLatest: index === logs.length - 1,
    })),

    invoiceDocumentId: order.invoices?.[0]?.invoiceDocumentId || "",
    orderLink: `/dashboard/orders/view/${order._id}`,
  };
};

export const downloadInvoice = (invoiceDocumentId: string) => {
  if (!invoiceDocumentId) return;
  CommonService.assetDownload(invoiceDocumentId);
};
