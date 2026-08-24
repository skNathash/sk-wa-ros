/**
 * Shared qty / status helpers for the PO process table + edit modal.
 * Keeps shortage math aligned with preparePayload in helper.ts.
 */

export type ProductReceiveStatus = "OK" | "DAMAGED" | "SHORT";

export function getVariationQty(product: any): number {
  const variations = product?.formData?.variations || [];
  if (!Array.isArray(variations)) return 0;
  return variations.reduce(
    (sum: number, v: any) => sum + (Number(v.formData?.qty) || 0),
    0,
  );
}

/** Shortage vs ordered qty (matches preparePayload shortageQuantity). */
export function getShortQty(product: any): number {
  const ordered = Number(product?.quantity) || 0;
  const received = Number(product?.formData?.receivedQty) || 0;
  const damaged = Number(product?.formData?.damageQty) || 0;
  const variationQty = getVariationQty(product);
  return Math.max(0, ordered - received - damaged - variationQty);
}

export function getProductReceiveStatus(product: any): ProductReceiveStatus {
  const damaged = Number(product?.formData?.damageQty) || 0;
  if (damaged > 0) return "DAMAGED";
  if (getShortQty(product) > 0) return "SHORT";
  return "OK";
}

export function clampNonNegative(value: number): number {
  if (Number.isNaN(value) || value < 0) return 0;
  return value;
}

/**
 * Apply table / form qty edits with the same caps used by ProductItemForm:
 * - invoiceQty: uncapped (can exceed ordered)
 * - receivedQty: capped by invoiceQty (or ordered if invoice missing)
 * - damageQty: independent of received; capped by invoice/ordered minus received/variations
 *   (allows all-damaged receipts when received is 0)
 * - shortQty (UI): adjusts receivedQty so ordered ≈ received + damage + short + variations
 */
export function applyQtyFieldChange({
  product,
  field,
  rawValue,
}: {
  product: any;
  field: "invoiceQty" | "receivedQty" | "damageQty" | "shortQty";
  rawValue: string | number;
}): Record<string, any> {
  const formData = { ...(product.formData || {}) };
  const ordered = Number(product.quantity) || 0;
  let next = clampNonNegative(Number(rawValue) || 0);

  const invoiceQty = Number(formData.invoiceQty) || 0;
  let receivedQty = Number(formData.receivedQty) || 0;
  let damageQty = Number(formData.damageQty) || 0;
  const variationQty = getVariationQty(product);
  const invoiceCap = (capInvoice: number) =>
    capInvoice > 0 ? capInvoice : ordered;

  if (field === "invoiceQty") {
    formData.invoiceQty = next;
    const cap = invoiceCap(next);
    if (receivedQty > cap) {
      formData.receivedQty = cap;
      receivedQty = cap;
    }
    const maxDamage = Math.max(0, cap - receivedQty - variationQty);
    if (damageQty > maxDamage) {
      formData.damageQty = maxDamage;
    }
  } else if (field === "receivedQty") {
    const cap = invoiceCap(invoiceQty);
    if (next > cap) next = cap;
    // Keep room for existing damage + variations within the invoice/ordered cap
    const maxReceived = Math.max(0, cap - damageQty - variationQty);
    if (next > maxReceived) next = maxReceived;
    formData.receivedQty = next;
  } else if (field === "damageQty") {
    // Damaged is independent of received — all units can arrive damaged
    const cap = invoiceCap(invoiceQty);
    const maxDamage = Math.max(0, cap - variationQty);
    if (next > maxDamage) next = maxDamage;
    formData.damageQty = next;
    // Free capacity from received if damage would otherwise overflow the cap
    const maxReceived = Math.max(0, cap - next - variationQty);
    if (receivedQty > maxReceived) {
      formData.receivedQty = maxReceived;
    }
  } else if (field === "shortQty") {
    // Editing short drives received: received = ordered - damage - short - variations
    damageQty = Number(formData.damageQty) || 0;
    const maxShort = Math.max(0, ordered - damageQty - variationQty);
    if (next > maxShort) next = maxShort;
    const nextReceived = Math.max(0, ordered - damageQty - variationQty - next);
    const cap = invoiceCap(invoiceQty);
    formData.receivedQty = Math.min(nextReceived, cap);
  }

  return formData;
}

export function getProductBadgeLabel(product: any): {
  label: string;
  tone: "sku" | "own";
} {
  if (product?.isOwnProduct) return { label: "OWN", tone: "own" };
  return { label: "SKU", tone: "sku" };
}
