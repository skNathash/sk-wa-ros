import { endOfDay, startOfDay } from "date-fns";
import { AuthService } from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PaginationState } from "~/types/CommonTypes";

/**
 * PO statuses considered still "in-flight" (not yet fully received). Kept in sync
 * with the main dashboard's arriving-today badge (main/helper.ts) so the
 * "Arriving Today" chip here counts the same set of orders.
 */
const ACTIVE_PO_STATUSES = ["Approved", "Partially Received"];

/**
 * Quick-filter chips shown above the search row. The three source chips are a
 * shortcut for the `purchasedFrom` (type) filter; "Arriving Today" is a separate
 * axis that filters by expected-delivery-date instead of source. The chips are
 * single-select — picking one clears the others (see FilterChips).
 */
export const filterChips = [
  { value: "all", label: "All", langKey: "all" },
  { value: "arrivingToday", label: "Arriving Today", langKey: "arrivingToday" },
  { value: "Local Vendor", label: "Local Vendor", langKey: "localVendor" },
  { value: "StoreKing", label: "StoreKing", langKey: "storeKing" },
  { value: "Added Stock", label: "Stock Added", langKey: "stockAdded" },
];

/**
 * Derive which chip is active from the current form state. `arrivingToday` wins
 * over a source selection because the two are mutually exclusive in the UI.
 */
export const getActiveChip = (filters: Record<string, any>): string => {
  if (filters.arrivingToday) return "arrivingToday";
  const source = filters.purchasedFrom;
  if (source && source !== "All") return source;
  return "all";
};

export const prepareFilterParams = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    groupByCond: "po",
    groupByType: filters.groupByType || "total",
  };

  const search = filters.search?.trim();
  if (search) {
    params.search = search;
    // params.filter.$or = [
    //   {
    //     "to.name": { $regex: search, $options: "i" },
    //   },
    //   {
    //     "orderData.refId": { $regex: search, $options: "i" },
    //   },
    //   {
    //     "to.refId": { $regex: search, $options: "i" },
    //   },
    // ];
  }

  if (filters.vendorInfo?._id) {
    params.filter["vendorInfo.vendorId"] = filters.vendorInfo._id;
  }

  if (filters.dateRange?.length === 2) {
    // If grouping by received POs, the backend expects received date range keys
    if (0 && filters.groupByType === "received") {
      params.receivedStartDate = startOfDay(filters.dateRange[0]).toISOString();
      params.receivedEndDate = endOfDay(filters.dateRange[1]).toISOString();
    } else {
      params.startDate = startOfDay(filters.dateRange[0]).toISOString();
      params.endDate = endOfDay(filters.dateRange[1]).toISOString();
    }
  }

  if (filters.status && filters.status !== "All") {
    const found = PurchaseOrderService.getStatuses().find(
      (x) => x.value === filters.status
    )?.status;
    if (found) params.filter.status = { $in: found };
  }

  // "Arriving Today" chip: restrict to POs whose expected delivery falls today.
  // Default to the active (not-yet-received) statuses so it reads as "still
  // coming", unless the user has picked an explicit status in the filter modal.
  if (filters.arrivingToday) {
    const now = new Date();
    params.filter.expectedDeliveryDate = {
      $gte: startOfDay(now).toISOString(),
      $lte: endOfDay(now).toISOString(),
    };
    if (!params.filter.status) {
      params.filter.status = { $in: ACTIVE_PO_STATUSES };
    }
  }

  if (filters.purchasedFrom && filters.purchasedFrom !== "All") {
    if (filters.purchasedFrom === "Local Vendor") {
      params.filter.source = "manual";
    } else if (filters.purchasedFrom === "StoreKing") {
      params.filter.source = "sk_order";
    } else if (filters.purchasedFrom === "Added Stock") {
      params.filter.source = "add_stock_inventory";
    }
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await PurchaseOrderService.getPoDashboardSummary(
      AuthService.getLoggedInUserId(),
      params
    );
    return (response.data?.data?.poList || []).map((e: any) => {
      const formatted: Record<string, any> =
        PurchaseOrderService.formatPoDashboardSummary(e);

      const status = PurchaseOrderService.getStatusLabelAndColor(
        formatted.status,
        PurchaseOrderService.getStatuses()
      );

      return {
        ...formatted,
        _statusLabel: status.label,
        _statusColor: status.color,
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};

/** Count + rupee value for one slice of the purchase summary. */
export type PoSummarySlice = {
  count: number;
  value: number;
};

export type PoSummaryCounts = {
  total: PoSummarySlice;
  localVendor: PoSummarySlice;
  storeKing: PoSummarySlice;
  stockAdded: PoSummarySlice;
  /** Length of the active date filter, in days — drives the "LAST 30D" label. */
  rangeDays: number;
};

/**
 * Fetch the top-of-page summary figures.
 *
 * The summary endpoint only exposes overall totals (no per-source breakdown),
 * so the source splits are derived by re-querying with each `filter.source`
 * value. The base params keep the user's current search / date / vendor filters
 * but drop any `purchasedFrom` source filter so the strip always shows the full
 * breakdown regardless of the selected tab.
 */
export const getSummary = async (
  baseParams: Record<string, any>,
): Promise<PoSummaryCounts> => {
  const userId = AuthService.getLoggedInUserId();

  const rangeDays =
    baseParams.startDate && baseParams.endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(baseParams.endDate).getTime() -
              new Date(baseParams.startDate).getTime()) /
              86400000,
          ),
        )
      : 0;

  const buildParams = (source?: string) => {
    const { groupByType, groupByCond, ...rest } = baseParams;
    const params: Record<string, any> = {
      ...rest,
      filter: { ...(baseParams.filter || {}) },
    };
    if (source) {
      params.filter.source = source;
    } else {
      delete params.filter.source;
    }
    return params;
  };

  const fetchSlice = async (source?: string): Promise<PoSummarySlice> => {
    try {
      const response = await PurchaseOrderService.getPoDashboardSummary(
        userId,
        buildParams(source),
      );
      const overall = response.data?.data?.overallSummary || {};
      return {
        count: overall.totalPO || 0,
        value: overall.totalPOValue || 0,
      };
    } catch (error) {
      console.error(error);
      return { count: 0, value: 0 };
    }
  };

  const [total, localVendor, storeKing, stockAdded] = await Promise.all([
    fetchSlice(),
    fetchSlice("manual"),
    fetchSlice("sk_order"),
    fetchSlice("add_stock_inventory"),
  ]);

  return { total, localVendor, storeKing, stockAdded, rangeDays };
};

export const getCount = async (params: Record<string, any>) => {
  const { groupByType, groupByCond, ...rest } = params;

  try {
    const response = await PurchaseOrderService.getPoDashboardSummary(
      AuthService.getLoggedInUserId(),
      {
        ...rest,
      }
    );

    if (params.groupByType === "total") {
      return response.data?.data?.overallSummary?.totalPO || 0;
    } else if (params.groupByType === "received") {
      return response.data?.data?.receivedSummary?.totalPO || 0;
    } else if (params.groupByType === "notReceived") {
      return response.data?.data?.notReceivedSummary?.totalPO || 0;
    }
  } catch (error) {
    console.error(error);
    return 0;
  }
};
