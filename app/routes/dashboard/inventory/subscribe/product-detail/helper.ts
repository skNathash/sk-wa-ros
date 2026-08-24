import InventorySubscribeService from "~/services/InventorySubscribeService";

/**
 * The deal behind the detail page. Most callers pass the mongo `_id`, but rails
 * fed by APIs that only carry the deal reference (e.g. price-comparison) pass
 * the readable `dealId` instead — so the filter switches on the id's shape.
 */
export const getDeal = async (id: string) => {
  const isObjectId = /^[0-9a-f]{24}$/i.test(id);

  const response = await InventorySubscribeService.getDeals({
    filter: isObjectId ? { _id: id } : { dealId: id },
  });

  const rows = response?.data?.data || [];
  if (rows.length === 0) return null;

  return InventorySubscribeService.formatDealResponse(rows)[0];
};

/**
 * Other subscribable products from the same category — feeds the "Similar in
 * category" block of the side pane. Sorted by name so the preview stays stable
 * between visits.
 */
export const getSimilarDeals = async (
  categoryId: string,
  { count = 6, excludeDealId }: { count?: number; excludeDealId?: string } = {},
) => {
  if (!categoryId) return [];

  try {
    const response = await InventorySubscribeService.getDeals({
      page: 1,
      // Fetch one extra so dropping the current product still fills the list.
      count: count + 1,
      sort: { dealName: 1 },
      filter: {
        status: "Active",
        "applicableCategory.categoryId": categoryId,
      },
    });

    return InventorySubscribeService.formatDealResponse(
      response.data?.data || [],
    )
      .filter((deal: any) => deal._id !== excludeDealId)
      .slice(0, count);
  } catch (error) {
    console.error(error);
    return [];
  }
};

/** Discount off MRP, as the percentage the seller saves buying from StoreKing. */
export const getSavingsPercent = (mrp: number, price: number) => {
  if (!mrp || !price || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

/**
 * Pack size for display — the catalog's net weight when it carries one, else
 * the deal's own quantity/unit pair.
 */
export const getPackSize = (deal: any) => {
  if (deal?.netWeight) return String(deal.netWeight);
  if (deal?.quantity && deal?.unit) return `${deal.quantity} ${deal.unit}`;
  return deal?.unit || "";
};
