import InventorySubscribeService from "~/services/InventorySubscribeService";

/**
 * Deal filter for a category preview — the shared subscribable-deal filter,
 * narrowed to one category, so the preview rows and the count in the footer
 * match what "View all" actually lands on. The category feed's own `totalDeals`
 * is a looser aggregate and reads higher than the list.
 */
const categoryDealParams = (categoryId: string) =>
  InventorySubscribeService.getSubscribableDealParams({
    filter: { "applicableCategory.categoryId": categoryId },
  });

/**
 * Fetch a preview of a category's subscribable deals to fill the expanded
 * accordion panel, along with the total that matches the subscribe search list.
 */
export const getCategoryDeals = async (
  categoryId: string,
  { page = 1, count = 4 }: { page?: number; count?: number } = {},
): Promise<{ deals: any[]; total: number | null }> => {
  const base = categoryDealParams(categoryId);

  try {
    const [response, countResponse] = await Promise.all([
      InventorySubscribeService.getDeals({
        ...base,
        page,
        count,
        sort: { dealName: 1 },
      }),
      InventorySubscribeService.getDealsCount(base).catch(() => null),
    ]);

    return {
      deals: InventorySubscribeService.formatDealResponse(
        response.data?.data || [],
      ),
      total: countResponse?.data?.data?.totalDeals ?? null,
    };
  } catch (error) {
    console.error(error);
    return { deals: [], total: null };
  }
};
