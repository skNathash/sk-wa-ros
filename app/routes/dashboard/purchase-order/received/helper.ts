import PurchaseOrderService from "~/services/PurchaseOrderService";

export type ReceivedSummary = {
  ordered: number;
  received: number;
  inwarded: number;
  damaged: number;
  pending: number;
  creditAmount: number;
  payableAmount: number;
};

export type InwardedItem = {
  key: string;
  dealId: string;
  dealName: string;
  quantity: number;
  value: number;
  locationName: string;
  rackName: string;
  binName: string;
  binId: string;
  expiry: string;
  isOwn: boolean;
};

export type ReturnedItem = {
  key: string;
  dealId: string;
  dealName: string;
  quantity: number;
  value: number;
  /** "REPLACEMENT" | "CREDIT NOTE" | "" — nothing to claim back for a plain short. */
  settlement: string;
  reference: string;
  reason: string;
  isOwn: boolean;
  isPending: boolean;
};

/**
 * Quantity that never made it into the box. The API carries `shortageQuantity`
 * per item; where it is absent (or zero on a line that still doesn't add up)
 * fall back to what ordered-minus-accounted-for implies.
 */
const shortQty = (item: any) => {
  const reported = Number(item.shortageQuantity || 0);
  if (reported > 0) return reported;

  return Math.max(
    0,
    Number(item.quantity || 0) -
      Number(item.receivedQuantity || 0) -
      Number(item.damagedQuantity || 0) -
      Number(item.cancelledQuantity || 0),
  );
};

/**
 * A deal the store stocks itself reads as OWN; anything pulled from the
 * StoreKing catalog reads as SKU. Catalog deals carry a `dealRefId`.
 */
const isOwnDeal = (item: any) =>
  Boolean(item.isOwnProduct || item.isOwnDeal) || !item.dealRefId;

/**
 * Per-item remarks live on the receipt entries, not on the order line, so the
 * damaged / short rows have to look them up by `itemId`.
 */
const buildReceiptRemarks = (partialReceipts: any[] = []) => {
  const remarks: Record<string, string> = {};

  (partialReceipts || []).forEach((receipt: any) => {
    (receipt.items || []).forEach((entry: any) => {
      if (entry.itemId && entry.remarks) remarks[entry.itemId] = entry.remarks;
    });
  });

  return remarks;
};

const unitPrice = (item: any) =>
  Number(item.purchasePrice || 0) || Number(item.mrp || 0);

export const buildSummary = (items: any[] = []): ReceivedSummary => {
  return items.reduce(
    (acc: ReceivedSummary, item: any) => {
      const inwarded = Number(item.receivedQuantity || 0);
      const damaged = Number(item.damagedQuantity || 0);
      const pending = shortQty(item);

      acc.ordered += Number(item.quantity || 0);
      acc.inwarded += inwarded;
      acc.damaged += damaged;
      acc.pending += pending;
      acc.received += inwarded + damaged;
      acc.payableAmount += inwarded * unitPrice(item);
      acc.creditAmount += (damaged + pending) * unitPrice(item);
      return acc;
    },
    {
      ordered: 0,
      received: 0,
      inwarded: 0,
      damaged: 0,
      pending: 0,
      creditAmount: 0,
      payableAmount: 0,
    },
  );
};

/** Lines that actually landed in stock — one row per item with a received qty. */
export const buildInwardedItems = (items: any[] = []): InwardedItem[] =>
  items
    .filter((item) => Number(item.receivedQuantity || 0) > 0)
    .map((item, index) => {
      const location = item.location || {};
      return {
        key: `${item.dealId || item.itemId || index}-inwarded`,
        dealId: item.dealId || "",
        dealName: item.dealName || "-",
        quantity: Number(item.receivedQuantity || 0),
        value: Number(item.receivedQuantity || 0) * unitPrice(item),
        locationName: location.name || "",
        rackName: location.rackName || "",
        binName: location.binName || "",
        binId: location.binId || "",
        expiry: item.expiry || item.expiryDate || "",
        isOwn: isOwnDeal(item),
      };
    });

/**
 * Damaged units (claimable back from the vendor) and short units (never
 * shipped) collapsed into the single "Returned / Pending" rail on the right.
 */
export const buildReturnedItems = (
  items: any[] = [],
  partialReceipts: any[] = [],
): ReturnedItem[] => {
  const rows: ReturnedItem[] = [];
  const receiptRemarks = buildReceiptRemarks(partialReceipts);

  (items || []).forEach((item: any, index: number) => {
    const damaged = Number(item.damagedQuantity || 0);
    const pending = shortQty(item);
    const price = unitPrice(item);
    const remarks = item.remarks || receiptRemarks[item.itemId] || "";

    if (damaged > 0) {
      rows.push({
        key: `${item.dealId || index}-damaged`,
        dealId: item.dealId || "",
        dealName: item.dealName || "-",
        quantity: damaged,
        value: damaged * price,
        settlement: item.returnType || item.damageSettlement || "DAMAGED",
        reference: item.rtvNumber || item.returnRefNo || "",
        reason: remarks || "Received damaged",
        isOwn: isOwnDeal(item),
        isPending: false,
      });
    }

    if (pending > 0) {
      rows.push({
        key: `${item.dealId || index}-pending`,
        dealId: item.dealId || "",
        dealName: item.dealName || "-",
        quantity: pending,
        value: pending * price,
        settlement: "PENDING",
        reference: "",
        reason: remarks || "Short shipped",
        isOwn: isOwnDeal(item),
        isPending: true,
      });
    }
  });

  return rows;
};

export const loadReceivedDetails = async (id: string) => {
  const response = await PurchaseOrderService.getDetails(id);
  const data = response?.data?.data;

  if (!data?._id) return null;

  const formatted = PurchaseOrderService.formatPurchaseOrderData(data);
  const items = formatted.items || [];

  const packages = Array.isArray(formatted.receivedPackages)
    ? formatted.receivedPackages
    : [];
  const latestPackage = packages.length ? packages[packages.length - 1] : null;

  const partialReceipts = Array.isArray(formatted.partialReceipts)
    ? formatted.partialReceipts
    : [];
  const latestReceipt = partialReceipts.length
    ? partialReceipts[partialReceipts.length - 1]
    : null;

  /* The order carries a single invoice object; a partial receipt carries its
     own. Prefer the order's, fall back to the last receipt's. */
  const invoiceDetails =
    (Array.isArray(formatted.invoiceDetails)
      ? formatted.invoiceDetails[0]
      : formatted.invoiceDetails) || latestReceipt?.invoiceDetails;

  return {
    ...formatted,
    _summary: buildSummary(items),
    _inwardedItems: buildInwardedItems(items),
    _returnedItems: buildReturnedItems(items, partialReceipts),
    _invoiceNumber: invoiceDetails?.refno || invoiceDetails?.invoiceNumber || "",
    _invoiceAmount: Number(invoiceDetails?.amount || 0),
    _packageId: latestPackage?.packageId || "",
    _closedAt:
      formatted.receiptSummary?.lastReceiptDate ||
      latestReceipt?.receiptDate ||
      formatted.actualDeliveryDate ||
      latestPackage?.receivedAt ||
      formatted.updatedAt ||
      "",
    _closedBy:
      formatted.receiptConfirmedBy?.userName ||
      latestReceipt?.receivedBy?.userName ||
      "",
  };
};
