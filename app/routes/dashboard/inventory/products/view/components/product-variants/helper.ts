import InventorySubscribeService from "~/services/InventorySubscribeService";

/** One row of the "Available variants" list. */
export interface ProductVariant {
  /** Catalog object id — the id the subscribe detail page is keyed on. */
  objId: string;
  /** Readable deal id — the id the inventory detail page is keyed on. */
  dealId: string;
  /** What separates this variant from its siblings, e.g. "200g glass jar". */
  label: string;
  /** Attribute the group is formed on, e.g. "Weight". */
  groupedOn: string;
  /** Meta line under the label: MOQ and pack size, when the catalog has them. */
  meta: string;
  /** B2B price StoreKing sells the variant at (falls back to MRP). */
  price: number;
  /** Already part of the seller's own catalog. */
  inCatalog: boolean;
}

/** Group values as they arrive on a formatted deal (formatGroupDealData). */
interface GroupValue {
  _id: string;
  dealId: string;
  name?: string;
  csa?: string;
  groupedOn?: string;
  isSubscribed?: boolean;
}

/** Every variant of the deal, across whatever attributes it is grouped on. */
export const collectGroupValues = (deal: any): GroupValue[] =>
  (deal?.groupDeals || []).flatMap((group: any) => group?.values || []);

const buildMeta = (raw: any) => {
  const uom = raw?.unit === "piece" ? "unit" : raw?.unit || "";
  const moq = raw?.b2bMinQuantity || raw?.minQuantity || 0;
  const packQty = (raw?.packConfig || []).find(
    (pack: any) => pack?.packType === "Case",
  )?.quantity;

  return [
    moq ? `MOQ ${moq}${uom ? ` ${uom}` : ""}` : "",
    packQty ? `pack of ${packQty}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
};

/**
 * Fetches the catalog rows behind a deal's group values so each variant can be
 * shown with its price and buying constraints. The group values only carry the
 * variant's label and subscription flag, so the labels come from there and the
 * commercial detail from the catalog response; a variant missing from the
 * response still renders, just without price/meta.
 */
export const getVariants = async (
  deal: any,
  signal?: AbortSignal,
): Promise<ProductVariant[]> => {
  const values = collectGroupValues(deal);
  const objIds = values.map((value) => value._id).filter(Boolean);
  if (objIds.length === 0) return [];

  let rawById: Record<string, any> = {};
  try {
    const response = await InventorySubscribeService.getDeals(
      {
        page: 1,
        limit: objIds.length,
        filter: { _id: { $in: objIds } },
      },
      signal ? { signal } : undefined,
    );
    for (const row of response?.data?.data || []) {
      rawById[row._id] = row;
    }
  } catch (error) {
    // Labels alone are still worth showing — fall through with no detail.
    rawById = {};
  }

  return values.map((value) => {
    const raw = rawById[value._id];
    return {
      objId: value._id,
      dealId: value.dealId,
      label: value.csa || raw?.name || value.name || "--",
      groupedOn: value.groupedOn || "",
      meta: buildMeta(raw),
      price: raw?.b2bPrice || raw?.mrp || 0,
      inCatalog: !!(value.isSubscribed || raw?.isSubscribed),
    };
  });
};
