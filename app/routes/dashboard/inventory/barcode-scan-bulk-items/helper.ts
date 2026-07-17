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

/** Status filter selections for the scan-history list. */
export type StatusFilter = "all" | "Requested" | "Pending";

export const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "Requested", label: "Sent for Approval" },
  { value: "Pending", label: "Pending To Create" },
];

export const prepareParams = (filter: any, pagination: any) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  if (filter.search?.trim()) {
    // Match either the scanned barcode or the AI-suggested deal name
    const search = filter.search.trim();
    params.filter.$or = [
      { barcode: search },
      { "result.aiSuggestedDeals.name": { $regex: search, $options: "i" } },
    ];
  }

  // "Sent for Approval" rows carry status "Requested"; anything else is still
  // pending to create.
  if (filter.status === "Requested") {
    params.filter.status = "Requested";
  } else if (filter.status === "Pending") {
    params.filter.status = { $ne: "Requested" };
  }

  // Scan date range — match the row's createdAt within the selected days,
  // anchoring `from` to the start of its day and `to` to the end of its day.
  if (filter.fromDate || filter.toDate) {
    const createdAt: Record<string, string> = {};
    if (filter.fromDate) {
      const from = new Date(filter.fromDate);
      from.setHours(0, 0, 0, 0);
      createdAt.$gte = from.toISOString();
    }
    if (filter.toDate) {
      const to = new Date(filter.toDate);
      to.setHours(23, 59, 59, 999);
      createdAt.$lte = to.toISOString();
    }
    params.filter.createdAt = createdAt;
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
    console.error("Error fetching bulk barcode items:", error);
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
    console.error("Error fetching bulk barcode items count:", error);
    return 0;
  }
};
