import type { AxiosRequestConfig } from "axios";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import BarcodeScanBulkService, {
  type ReviewDeal as ServiceReviewDeal,
  type MatchStatus as ServiceMatchStatus,
  type MatchStatusBadge as ServiceMatchStatusBadge,
  type ReviewItem as ServiceReviewItem,
} from "~/services/BarcodeScanBulkService";

export type ReviewDeal = ServiceReviewDeal;
export type MatchStatus = ServiceMatchStatus;
export type MatchStatusBadge = ServiceMatchStatusBadge;
export type ReviewItem = ServiceReviewItem;

export const dealImageProps = BarcodeScanBulkService.dealImageProps;

export const prepareParams = (filter: any, pagination: any) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      status: {
        $in: ["Completed", "Processing"],
      },
      matchStatus: {
        $in: ["FoundInAi", "NotFound"],
      },
    },
  };

  if (filter.search?.trim()) {
    // Standard text or barcode search
    // params.searchText = filter.search.trim();
    const s = filter.search.trim();
    params.filter.$or = [
      {
        "result.aiSuggestedDeals.name": { $regex: s },
      },
      {
        barcode: s,
      },
    ];
  }

  return params;
};

export const getData = async (
  params: Record<string, any>,
  config?: AxiosRequestConfig,
): Promise<ReviewItem[]> => {
  try {
    const res: any = await InventorySubscribeService.getAiBulkBarcodeScanItems(
      params,
      config,
    );
    const data = res?.data?.data ?? [];
    const rawItems = Array.isArray(data) ? data : (data.items ?? []);
    const items: ReviewItem[] = [];
    for (const item of rawItems) {
      items.push(BarcodeScanBulkService.formatItem(item));
    }
    return items;
  } catch (error) {
    console.error("Error fetching pending create items:", error);
    return [];
  }
};

export const getCount = async (
  params: Record<string, any>,
  config?: AxiosRequestConfig,
): Promise<number> => {
  try {
    const res: any = await InventorySubscribeService.getAiBulkBarcodeScanItems(
      {
        ...params,
        outputType: "count",
      },
      config,
    );
    // Accommodate multiple possible count response shapes
    return res?.data?.data?.count || res?.data?.count || 0;
  } catch (error) {
    console.error("Error fetching pending create items count:", error);
    return 0;
  }
};

/**
 * Build the bulk-create payload for one pending row, mirroring the shape
 * `AddProductModal` posts to `importStoreProduct` so every product reaching the
 * bulk endpoint has the same structure — notably `images` as plain asset ids.
 */
export const buildCreatePayload = (item: ReviewItem) => {
  const deal = item.deal;
  return {
    scanItemId: item.id,
    productName: deal?.title || "",
    qty: 0,
    mrp: deal?.mrp || 0,
    barcode: item.barcode,
    uom: "unit",
    description: "",
    images: (deal?.images || []).map((img: any) =>
      typeof img === "string" ? img : img?.id,
    ),
  };
};

/** Stable key used to track row selection (the scan item id). */
export const getItemKey = (item: ReviewItem): string => {
  return item.id || item.barcode;
};

/**
 * A row can be selected for bulk create only when it isn't already requested
 * and StoreKing AI matched it from the AI catalog (`FoundInAi`). `NotFound`
 * rows have no AI deal to seed the product, so they aren't bulk-selectable.
 */
export const isSelectable = (item: ReviewItem): boolean => {
  return item.status !== "Requested" && item.matchStatus === "FoundInAi";
};
