import { isToday, isYesterday } from "date-fns";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PaginationState } from "~/types/CommonTypes";

/**
 * Package lifecycle buckets used by the chip row and the summary strip.
 * A package is "waiting" until it is inwarded ("Shipped"), and "received" once
 * it has been fully or partially closed off. Kept in sync with the row state
 * badge in MobileViewTheme2 (`stateOf`).
 */
export const WAITING_STATUSES = ["Shipped"];
export const RECEIVED_STATUSES = [
  "Received",
  "Completed",
  "Delivered",
  "Partially Delivered",
];

/** True once a package has been inwarded — no receive action applies to it. */
export const isPackageReceived = (row: any) =>
  RECEIVED_STATUSES.includes(String(row?.status || ""));

/**
 * Filter state -> URL query params. The URL is the single source of truth for
 * the feed's filter, so every filter change writes here and the page reloads
 * off `searchParams`. Empty / default values are dropped to keep the URL clean.
 * The status bucket is not part of the URL — this feed is waiting-only.
 */
export const prepareFilterQueryParams = (
  filter: Record<string, any>,
): Record<string, string> => {
  const params: Record<string, string> = {};

  const search = filter.search?.trim();
  if (search) params.search = search;

  if (filter.purchasedFrom && filter.purchasedFrom !== "All") {
    params.purchasedFrom = filter.purchasedFrom;
  }

  return params;
};

export const prepareFilterParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: { key: string; value: "asc" | "desc" | undefined },
) => {
  const params: any = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {},
  };

  // Waiting-only feed: packages that have been shipped but not yet inwarded.
  params.filter.status = { $in: WAITING_STATUSES };

  if (sort && sort.key && sort.value) {
    params.sort = {
      [sort.key]: sort.value === "asc" ? 1 : -1,
    };
  }

  if (filter.search?.trim()) {
    const q = filter.search.trim();
    params.filter.$or = [
      // Box No (refNo)
      { refNo: q },
      // Order ID (orderData.refId)
      { "orderData.refId": q },
      // Invoice No (invoiceData.refId)
      { "invoiceData.refId": q },
      // Vendor name (from.name) - partial, case-insensitive
      { "from.name": { $regex: q, $options: "i" } },
      // Vendor id (from.id) - exact
      { "from.refId": q },
    ];
  }

  if (filter.purchasedFrom && filter.purchasedFrom !== "All") {
    if (filter.purchasedFrom === "Local Vendor") {
      params.filter.source = "manual";
    } else if (filter.purchasedFrom === "StoreKing") {
      params.filter.source = "sk_order";
    } else if (filter.purchasedFrom === "Added Stock") {
      params.filter.source = "add_stock_inventory";
    }
  }

  return params;
};

/** First letter of the vendor name for the contact dot; "V" when unknown. */
const initialsOf = (name?: string) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 1)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "V";

/**
 * Who the package is coming from — drives the contact dot colour.
 * Green = StoreKing, blue = peer retailer (seller), purple = local vendor.
 */
const avatarClsOf = (row: any) => {
  if (row?.from?.subType === "SK")
    return "tw:bg-primary tw:text-primary-foreground";
  if (row?.isSellerOrder) return "tw:bg-blue-500 tw:text-white";
  return "tw:bg-purple-500 tw:text-white";
};

export type PackageStateKey = "short" | "received" | "waiting";

export type PackageState = {
  key: PackageStateKey;
  label: string;
  tileCls: string;
  badgeCls: string;
};

/**
 * Lifecycle state of a package, as the row's leading tile + trailing badge.
 * The yet-to-receive feed is almost entirely "Shipped", but the same list is
 * reused for short/received rows, so all three are resolved here.
 * Kept in sync with WAITING_STATUSES / RECEIVED_STATUSES above.
 */
const stateOf = (row: any): PackageState => {
  const status = String(row?.status || "");

  if (status === "Short" || status === "Partially Received") {
    return {
      key: "short",
      label: "SHORT",
      tileCls: "tw:bg-red-100 tw:text-red-600",
      badgeCls: "tw:bg-red-100 tw:text-red-700",
    };
  }
  if (RECEIVED_STATUSES.includes(status)) {
    return {
      key: "received",
      label: "RECEIVED",
      tileCls: "tw:bg-emerald-100 tw:text-emerald-600",
      badgeCls: "tw:bg-emerald-100 tw:text-emerald-700",
    };
  }
  return {
    key: "waiting",
    label: "WAITING",
    tileCls: "tw:bg-amber-100 tw:text-amber-600",
    badgeCls: "tw:bg-amber-100 tw:text-amber-700",
  };
};

/**
 * Row view-model attached once, right after the API response, so the list
 * components stay presentational and these values are not recomputed on every
 * render. `isToday` / `isYesterday` are resolved against fetch time — good
 * enough for a feed that reloads on every filter change.
 */
const decorateRow = (row: any) => {
  const createdAt = row?.createdAt ? new Date(row.createdAt) : null;
  const valid = createdAt && !isNaN(createdAt.getTime());

  return {
    ...row,
    initials: initialsOf(row?.from?.name),
    avatarCls: avatarClsOf(row),
    state: stateOf(row),
    isToday: valid ? isToday(createdAt) : false,
    isYesterday: valid ? isYesterday(createdAt) : false,
  };
};

export const getData = async (params: Record<string, any>) => {
  try {
    // call packages to ensure packages cache is warmed like list helper
    const response = await PurchaseOrderService.getPoPackages(
      AuthService.getLoggedInUserId() || "",
      params,
    );

    const data = response.data?.data;
    if (response.statusCode === 200 && Array.isArray(data)) {
      return data.map((e) =>
        decorateRow(PurchaseOrderService.formatPoDashboardSummary(e)),
      );
    }
    return [];
  } catch (error) {
    console.error("Error fetching not-received purchase orders:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const { page, count, ...rest } = params;
    const response = await PurchaseOrderService.getPoPackages(
      AuthService.getLoggedInUserId() || "",
      { ...rest, outputType: "count" },
    );
    if (response.statusCode === 200) return response.data?.data?.count || 0;
    return 0;
  } catch (error) {
    console.error("Error fetching not-received purchase orders count:", error);
    return 0;
  }
};
