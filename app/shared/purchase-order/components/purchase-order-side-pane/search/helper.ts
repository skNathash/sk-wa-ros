import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

let abortController: AbortController | null = null;

/**
 * Fetch purchase orders for the side-pane Autocomplete search.
 * Matches by order id or vendor name, same shape as BrandSearchInput results.
 */
export const getData = async (query: string, page: number) => {
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  const filter: Record<string, any> = {
    "franchiseInfo.id": AuthService.getLoggedInUserId(),
  };

  if (query.trim()) {
    filter.$or = [
      { orderId: { $regex: query.trim(), $options: "i" } },
      { "vendorInfo.name": { $regex: query.trim(), $options: "i" } },
    ];
  }

  try {
    const response = await PurchaseOrderService.getList({
      page,
      count: 10,
      filter,
      sort: { createdAt: -1 },
    });

    const data = response.data?.data;
    if (response.statusCode !== 200 || !Array.isArray(data)) {
      return [];
    }

    return data.map((item: any) => {
      const formatted = PurchaseOrderService.formatPurchaseOrderData(item);
      const orderId = formatted.orderId || item.orderId || "--";
      const vendorName = formatted.vendorInfo?.name || item.vendorInfo?.name || "";

      return {
        label: vendorName ? `${orderId} · ${vendorName}` : orderId,
        value: {
          id: formatted._id || item._id,
          name: orderId,
          orderId,
          vendorName,
        },
      };
    });
  } catch (error: any) {
    if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
      return [];
    }
    console.error("Error searching purchase orders for side pane:", error);
    return [];
  }
};
