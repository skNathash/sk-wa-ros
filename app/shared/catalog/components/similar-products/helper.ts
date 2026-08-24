import SellerCatalogService from "~/services/SellerCatalogService";

/** One card in the similar-products rail. */
export interface SimilarProduct {
  /** Catalog object id — what the subscribe detail page is keyed on. */
  objId: string;
  /** Readable deal id — what the seller's own item page is keyed on. */
  dealId: string;
  name: string;
  /** First image asset id, empty when the deal carries none. */
  image: string;
  mrp: number;
  /** Selling price when the catalog has one, else the MRP. */
  price: number;
  /** Show the MRP struck through — only when it sits above the price. */
  showStrikedMrp: boolean;
  /** What sets this variant apart, e.g. "75 g · Pouch" or "Pack of 6". */
  variant: string;
  /** Already part of the seller's own catalog. */
  inCatalog: boolean;
}

/** Catalog uoms are stored shouting; these read better on a card. */
const UOM_LABELS: Record<string, string> = {
  GM: "g",
  GRAM: "g",
  GRAMS: "g",
  KG: "kg",
  MG: "mg",
  ML: "ml",
  L: "L",
  LTR: "L",
  LITRE: "L",
  PCS: "pcs",
  PC: "pc",
  NOS: "nos",
  UNIT: "unit",
};

const buildVariantLabel = (deal: any) => {
  const uom = String(deal?.uom || "").toUpperCase();
  const weight = Number(deal?.weight) || 0;
  const packSize = Number(deal?.packSize) || 0;

  return [
    weight ? `${weight} ${UOM_LABELS[uom] || deal?.uom || ""}`.trim() : "",
    packSize > 1 ? `Pack of ${packSize}` : "",
    deal?.packagingType || "",
  ]
    .filter(Boolean)
    .join(" · ");
};

/**
 * Fetches the variants that sit alongside a deal and shapes them for display —
 * price/MRP resolved, variant line built and image picked here so the cards
 * stay markup only. Failures return an empty rail rather than surfacing.
 */
export const getSimilarProducts = async (
  dealId: string,
  signal?: AbortSignal,
): Promise<SimilarProduct[]> => {
  if (!dealId) return [];

  try {
    const response = await SellerCatalogService.getSimilarVariants(
      dealId,
      signal ? { signal } : undefined,
    );

    const rows = (response?.data?.data || []).filter(
      // The source deal is not expected back, but never show it twice.
      (deal: any) => deal?.dealId !== dealId && deal?._id !== dealId,
    );

    return rows.map((deal: any) => {
      const mrp = Number(deal?.mrp) || 0;
      const price = Number(deal?.price ?? deal?.b2bPrice) || mrp;

      return {
        objId: deal?._id || "",
        dealId: deal?.dealId || "",
        name: deal?.name || deal?.dealName || "--",
        image: deal?.images?.[0] || "",
        mrp,
        price,
        showStrikedMrp: mrp > 0 && price > 0 && price < mrp,
        variant: buildVariantLabel(deal),
        inCatalog: !!deal?.isSubscribed,
      } as SimilarProduct;
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};
