import { endOfDay, startOfDay } from "date-fns";
import FranchiseService from "~/services/FranchiseService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: sort?.key
      ? { [String(sort.key)]: sort?.value === "asc" ? 1 : -1 }
      : undefined,
    filter: {},
  };

  // allow filtering by poId (refOrderNo or orderInfo.id) if provided
  if (filter.poId) {
    params.filter["orderInfo.id"] = String(filter.poId);
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

/**
 * Fetches commission / platform-fee items for a given PO and maps them to the
 * shape expected by the PurchaseCommission UI (receiptId, amount, taxInfo, createdAt).
 */
export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.getPlatformFeeStatement(params);
  const items = response?.data?.data || [];

  // Map FranchiseService items to UI-friendly shape
  return items.map((item: any) => {
    return {
      // `receiptId` in UI was previously used as a key; use transactionId or refId
      receiptId: item.refId,
      amount: item.amount || 0,
      taxInfo: item.taxInfo || { gst: item.gst || 0 },
      createdAt: item.createdAt,
      // preserve subscriptionId for download actions (platform-fee)
      subscriptionId: item.subscriptionId,
      // preserve original payload for any further actions
      _raw: item,
    };
  });
};
