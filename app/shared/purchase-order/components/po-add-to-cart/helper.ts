import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { PurchaseCartItemPayload } from "~/services/PurchaseCartService";
import VendorService from "~/services/VendorService";

export type PoAddToCartType = "catalog" | "purchased" | "subscribe";

export type FormattedCartDeal = Omit<PurchaseCartItemPayload, "quantity">;

const normalizeUom = (uom?: string) => {
  const value = String(uom || "piece").toLowerCase();
  if (value === "pcs" || value === "pc") return "piece";
  return uom || "piece";
};

/** Map a deal API row to the fields required by the cart API. */
export const formatDealForCart = (
  raw: Record<string, any>,
): FormattedCartDeal => {
  const mrp = Number(raw.mrp) || 0;
  const lastBuyPrice =
    Number(raw.purchasePrice ?? raw.lastPurchasePrice) || 0;
  const purchasePrice = lastBuyPrice > 0 ? lastBuyPrice : mrp;

  return {
    dealId: String(raw.dealId || ""),
    dealName: raw.name || raw.dealName || raw.productName || "",
    productId: raw.productId,
    productName: raw.productName || raw.name || raw.dealName || "",
    mrp,
    purchasePrice,
    tax: Number(raw.tax ?? raw.gst ?? raw.igst) || undefined,
    uom: normalizeUom(raw.uom || raw.unit),
    hsn: raw.hsn || raw.hsnNumber || "",
  };
};

/**
 * Fetch deal details for add-to-cart.
 * Picks catalog / purchased / subscribe API by `type`, then formats the deal.
 * The API returns only the requested deal — no FE matching needed.
 */
export const fetchDealDetails = async (
  vendorId: string,
  dealId: string,
  type: PoAddToCartType,
): Promise<FormattedCartDeal | null> => {
  if (type === "subscribe") {
    const response = await InventorySubscribeService.getDeals({
      page: 1,
      limit: 1,
      filter: { _id: dealId },
    });
    const raw = response?.data?.data?.[0];
    if (!raw) return null;
    // Subscribe deals keep the Mongo object id on `_id` (not `dealId`).
    return formatDealForCart({ ...raw, dealId: raw._id });
  }

  const params = {
    page: 1,
    limit: 1,
    filter: { dealId },
  };

  const response =
    type === "catalog"
      ? await VendorService.getVendorCatalog(vendorId, params)
      : await VendorService.getPurchasedDealsByFranchise(vendorId, params);

  const raw = response?.data?.data?.[0];
  if (!raw) return null;

  return formatDealForCart(raw);
};

export const toCartItem = (
  deal: FormattedCartDeal,
  quantity: number,
): PurchaseCartItemPayload => ({
  ...deal,
  quantity,
});
