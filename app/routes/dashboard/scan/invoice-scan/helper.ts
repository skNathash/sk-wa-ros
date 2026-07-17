import AuthService from "~/services/AuthService";
import type { InvoiceItem, ParsedInvoice, SimilarVendor } from "./types";

/**
 * Per-unit discount percentage derived from MRP and price:
 * (mrp − price) / mrp × 100, clamped to [0, 100] and rounded to 2 decimals.
 */
export const calcDiscountPercent = (mrp: number, price: number): number => {
  if (!mrp || mrp <= 0) return 0;
  const pct = ((mrp - price) / mrp) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)) * 100) / 100;
};

/**
 * Price derived from MRP and a discount percentage:
 * mrp × (1 − discount/100). Discount is clamped to [0, 100].
 */
export const calcPriceFromDiscount = (mrp: number, discount: number): number => {
  const disc = Math.min(100, Math.max(0, discount || 0));
  return Math.max(0, (mrp || 0) * (1 - disc / 100));
};

/**
 * Prepare purchase order creation payload from scanned invoice data
 */
export const preparePurchaseOrderPayload = (
  invoiceData: ParsedInvoice,
  selectedVendor: SimilarVendor,
) => {
  const user = AuthService.getLoggedInUser();

  const items = invoiceData.items
    .filter((item) => !item.selected?.isPending)
    .map((item) => {
      const sel = item.selected;
      const gst =
        sel?.gst ??
        (item.cgstPercent ?? 0) +
          (item.sgstPercent ?? 0) +
          (item.igstPercent ?? 0);
      const halfGst = gst / 2;

      return {
        dealId: sel?.dealId || "",
        dealName: sel?.dealName || item.name,
        quantity: sel?.qty ?? item.qty,
        mrp: sel?.mrp ?? item.mrp,
        purchasePrice: sel?.price ?? item.price,
        barcode: sel?.barcode ?? item.barcode,
        hsn: sel?.hsn ?? item.hsn,
        tax: gst,
        cgst: halfGst,
        sgst: halfGst,
        status: "Pending",
      };
    });

  return {
    vendorInfo: {
      id: selectedVendor.id,
    },
    purchaseFrom: {
      id: selectedVendor.id,
      type: "Vendor",
      name: selectedVendor.name,
      address: selectedVendor.address?.addressLine || "",
    },
    franchiseInfo: {
      id: user._id,
    },
    items,
    status: "Approved",
    remarks: `Invoice #${invoiceData.invoice.invoiceNumber || ""}`,
    invoiceData: {
      refId: invoiceData.invoice.invoiceNumber || "",
      date: invoiceData.invoice.invoiceDate || "",
    },
    paymentSummary: [],
    expectedDeliveryDate: "",
  };
};

/**
 * Prepare purchase order receive payload from scanned invoice data
 */
export const prepareReceivePayload = (
  invoiceData: ParsedInvoice,
) => {
  const items: any[] = [];

  invoiceData.items.forEach((item) => {
    const sel = item.selected;
    if (sel?.isPending) return;
    const mrp = sel?.mrp ?? item.mrp;
    const purchasePrice = sel?.price ?? item.price;
    const receivedQty = sel?.qty ?? item.qty;
    const gst =
      sel?.gst ??
      (item.cgstPercent ?? 0) + (item.sgstPercent ?? 0) + (item.igstPercent ?? 0);
    const halfGst = gst / 2;
    const discount = calcDiscountPercent(mrp, purchasePrice);

    items.push({
      dealId: sel?.dealId || "",
      dealName: sel?.dealName || item.name,
      purchasePrice,
      mrp,
      discount,
      barcode: sel?.barcode ?? item.barcode,
      hsn: sel?.hsn ?? item.hsn,
      expiry: "",
      receivedQuantity: receivedQty,
      status: "Completed",
      damagedQuantity: 0,
      damagedImages: [],
      shortageQuantity: 0,
      damagedReason: "",
      manufactureDate: "",
      remarks: "",
      invoicedQuantity: receivedQty,
      invoiceQuantity: receivedQty,
    });
  });

  const invoiceDetails = invoiceData.invoice.invoiceNumber
    ? [
        {
          refno: invoiceData.invoice.invoiceNumber || "",
          remarks: "",
          invoiceDate: invoiceData.invoice.invoiceDate || "",
          documentAssetIds: [],
          amount: invoiceData.totals?.grandTotal || 0,
        },
      ]
    : undefined;

  return {
    remarks: "",
    paymentStatus: "Pending",
    ...(invoiceDetails ? { invoiceDetails } : {}),
    items,
  };
};
