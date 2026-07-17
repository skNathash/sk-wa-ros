import type { AxiosRequestConfig } from "axios";

import InventorySubscribeService from "~/services/InventorySubscribeService";
import BarcodeScanBulkService, {
  SORT_OPTIONS,
  type ReviewDeal as ServiceReviewDeal,
  type MatchStatus as ServiceMatchStatus,
  type MatchStatusBadge as ServiceMatchStatusBadge,
  type ReviewItem as ServiceReviewItem,
  type SortKey as ServiceSortKey,
  type DealFilter as ServiceDealFilter,
} from "~/services/BarcodeScanBulkService";

/** How often the review list re-fetches the batch while items are Pending. */
export const POLL_INTERVAL_MS = 5000;

export type ReviewDeal = ServiceReviewDeal;
export type MatchStatus = ServiceMatchStatus;
export type MatchStatusBadge = ServiceMatchStatusBadge;
export type ReviewItem = ServiceReviewItem;
export type SortKey = ServiceSortKey;
export type DealFilter = ServiceDealFilter;

export { SORT_OPTIONS };
export const sortDeals = BarcodeScanBulkService.sortDeals;
export const filterDeals = BarcodeScanBulkService.filterDeals;

export const dealImageProps = BarcodeScanBulkService.dealImageProps;

export function seedReviewItems(
  scanned: { barcode: string; qty: number }[],
): ReviewItem[] {
  return BarcodeScanBulkService.seedReviewItems(scanned);
}

/**
 * Fetch a bulk barcode-scan batch and format its items into `ReviewItem`s.
 */
export async function getData(
  batchId: string,
  config?: AxiosRequestConfig,
): Promise<ReviewItem[]> {
  const res: any = await InventorySubscribeService.getAiBulkBarcodeScanBatch(
    batchId,
    config,
  );
  // The create response nests the batch under `data.data.batch`, so items can
  // live under either `data.data.items` or `data.data.batch.items` depending
  // on the endpoint — accept both rather than silently returning [].
  const data = res?.data?.data ?? {};
  const items: any[] = data.items ?? data.batch?.items ?? [];
  const reviewItems: ReviewItem[] = [];
  for (const item of items) {
    reviewItems.push(BarcodeScanBulkService.formatItem(item));
  }
  return reviewItems.sort((a, b) => BarcodeScanBulkService.sortSkFirst(a, b));
}

