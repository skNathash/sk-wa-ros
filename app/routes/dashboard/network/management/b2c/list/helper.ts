import CustomerService from "~/services/CustomerService";
import AuthService from "~/services/AuthService";
import { startOfDay, endOfDay } from "date-fns";
import type { PaginationState } from "~/types/CommonTypes";
import type { SortValue } from "~/components/feature/utility/sort/SortPopover";

/** Days since the last order — drives the Active / "Last · 2d" status line. */
const daysSince = (date?: string | null) =>
  date
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(date).getTime()) / 86400000),
      )
    : undefined;

/** First value that is actually present — used for the metric aliases below. */
const firstOf = (...values: any[]) =>
  values.find((v) => v !== undefined && v !== null);

const initialsOf = (name?: string) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const addressLine = (address?: Record<string, any>) =>
  address?.city && address?.state
    ? `${address.city}, ${address.state}`
    : address?.city || address?.district || "N/A";

export type CustomerListResult = {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

/**
 * Normalise one row of `customer/dashboard/customers` into the shape the
 * desktop table and the mobile cards render. The directory metrics (coins,
 * bills, LTV, paylater) are read through aliases so the row keeps working
 * whichever naming the enriched payload uses.
 */
const mapCustomer = (item: any, loggedUserId?: string) => {
  const connectedFranchise = (item.connectedFranchisesList || []).find(
    (f: any) => f.id === loggedUserId,
  );
  const lastOrderDate =
    firstOf(item.lastOrderDate, connectedFranchise?.lastOrderDate) || null;
  const daysSinceOrder = daysSince(lastOrderDate);

  const defaultShipping = (item.shippingAddress || []).find(
    (a: any) => a.isDefault,
  );

  const isActiveBuyer = item.isActiveBuyer === true;
  const isEnabled = item.isActive !== false;
  const statusBadge = CustomerService.getCustomerStatusBadge(
    isActiveBuyer,
    isEnabled,
  );

  return {
    ...item,
    initials: initialsOf(item.name),
    formattedAddress: addressLine(item.address || defaultShipping),
    defaultShipping,
    lastOrderDate,
    daysSinceOrder,
    // Registration date the "Registered on" column and filter run on.
    registeredOn: firstOf(item.dateOfRegistration, item.createdAt) || null,
    // "Active" on the row is the buyer flag the API sends, not the account
    // flag — the account flag is kept separately as `isEnabled`.
    isActiveBuyer,
    isEnabled,
    _statusLabel: statusBadge.label,
    _statusColor: statusBadge.color,
    _statusClass: statusBadge.className,

    coins: firstOf(item.coins, item.kingCoins, item.loyaltyPoints, 0),
    bills: firstOf(item.bills, item.orderCount, item.totalOrders, 0),
    ltv: firstOf(item.ltv, item.lifetimeValue, item.totalOrderValue, 0),
    onTimePercent: firstOf(item.onTimePercent, item.onTimePaymentPercent, 0),
    paylaterUsed: firstOf(
      item.paylaterUsed,
      item.paylater?.used,
      item.paylater?.outstanding,
      0,
    ),
    paylaterLimit: firstOf(item.paylaterLimit, item.paylater?.limit, 0),
    tag: item.tag,
  };
};

/**
 * Customer directory page. The endpoint returns rows and pagination together,
 * so callers get the total from the same round trip.
 */
export const getData = async (
  params: Record<string, any>,
): Promise<CustomerListResult> => {
  const response = await CustomerService.getCustomerDashboardList(params);
  const body = response?.data || {};
  const loggedUserId = AuthService.getLoggedInUserId();

  const pagination = body.pagination || {};

  return {
    data: (body.data || []).map((item: any) => mapCustomer(item, loggedUserId)),
    pagination: {
      page: pagination.page || params.page || 1,
      limit: pagination.limit || params.limit || 10,
      total: pagination.total || 0,
      pages: pagination.pages || 0,
    },
  };
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: SortValue,
) => {
  // pagination is optional; provide sensible defaults when not passed
  let params: Record<string, any> = {
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
    filter: {},
    // The column headers and the mobile sort popover both write here; with
    // nothing picked the directory stays on recency.
    sort: sort?.key || "lastOrderDate",
    order: sort && sort.value === 1 ? "asc" : "desc",
  };

  // Search travels inside `filter` — e.g. filter={"search":"6363144894"}
  if (filter.search) {
    params.filter.search = filter.search;
  }

  if (filter.alpha) {
    params.filter.search = `^${filter.alpha}`;
  }

  // Directory segment — the summary tiles and the pane chips both write here.
  // The endpoint resolves the segment server-side with the same rule it uses
  // for the `loyaltySummary` cards: loyal | paylater | silent | coins.
  if (filter.segment && filter.segment !== "all") {
    params.filter.segment = filter.segment;
  }

  // Status filter — same flag the Status column renders (Active / Inactive).
  if (filter.status === "active") {
    params.filter.isActiveBuyer = true;
  } else if (filter.status === "inactive") {
    params.filter.isActiveBuyer = false;
  }

  if (filter.customerFilter === "birthday") {
    params.filter.dob = {
      $gte: startOfDay(new Date()),
      $lte: endOfDay(new Date()),
    };
  }

  // Registered-on range — filtered on the registration date the list shows,
  // as a full-day ISO window like the rest of the directory filters.
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.filter.dateOfRegistration = {
      $gte: startOfDay(new Date(filter.dateRange[0])).toISOString(),
      $lte: endOfDay(new Date(filter.dateRange[1])).toISOString(),
    };
  }

  if (Object.keys(params.filter).length === 0) {
    delete params.filter;
  }

  return params;
};

export type LoyaltySummaryCard = Record<string, any>;

export type CustomerSummary = {
  total: number;
  totalLtv: number;
  lastWeekCreated: number;
  cards: Record<string, LoyaltySummaryCard>;
};

const EMPTY_SUMMARY: CustomerSummary = {
  total: 0,
  totalLtv: 0,
  lastWeekCreated: 0,
  cards: {},
};

/**
 * Directory tiles for the current filter set. Same `customer/dashboard/customers`
 * endpoint the table uses — `outputType: "loyaltySummary"` swaps the rows for
 * the aggregated figures, so pagination is dropped from the params.
 */
export async function getSummary(
  filters: Record<string, any>,
): Promise<CustomerSummary> {
  // The tiles stay on the unsegmented totals — otherwise picking a tile would
  // zero out the other three and there would be no way back.
  const { segment, ...rest } = filters || {};
  const { page, limit, ...params } = prepareParams(rest);

  const response = await CustomerService.getCustomerDashboardList({
    ...params,
    outputType: "loyaltySummary",
  });
  const body = response?.data?.data;
  if (!body) return EMPTY_SUMMARY;

  return {
    total: body.totalCustomers || 0,
    totalLtv: body.totalLtv || 0,
    lastWeekCreated: body.cards?.newThisWeek?.count || 0,
    cards: body.cards || {},
  };
}
