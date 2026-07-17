import type { PrintSettingsValue } from "./components/PrintSettingsForm";

/** One product queued for bulk barcode printing — a single chosen barcode + copies. */
export type BulkBarcodeItem = {
  /** Seller deal id (dealId). */
  id: string;
  /** Human-facing deal reference id. */
  refId: string;
  name: string;
  barcode: string;
  mrp: number;
  expiry: string;
  quantity: number;
};

/**
 * Builds the barcode-print payload for one sheet.
 *
 * Array-first: a single deal is just a one-item list. Both the single-product
 * generator flow and the bulk flow share this one builder so the payload
 * contract lives in a single place.
 */
export const buildPayload = (
  settings: PrintSettingsValue,
  items: BulkBarcodeItem[],
) => {
  const deals = items.map((item) => ({
    dealId: item.id,
    barcode: item.barcode,
    quantity: Math.max(Number(item.quantity) || 1, 1),
  }));

  const payload: Record<string, any> = {
    size: settings.size,
    template: settings.template,
    deals,
  };

  // Price Type only applies to the retail ("Template 2") layout.
  if (settings.template === "retail") {
    payload.priceType = settings.priceType;
  }

  return payload;
};
