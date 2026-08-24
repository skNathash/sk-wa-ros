import FranchiseService from "~/services/FranchiseService";
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

const addressLine = (item?: Record<string, any>) => {
  if (!item) return "N/A";
  const city = item.city || item.town || "";
  const state = item.state || "";
  return city && state ? `${city}, ${state}` : city || state || "N/A";
};

export type FranchiseListResult = {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

/**
 * Normalise one row of `franchise/dashboard/franchises` into the shape the
 * desktop table and the mobile cards render. The dashboard API enriches each
 * franchise with derived B2B order metrics and the primary paylater wallet.
 */
const mapFranchise = (item: any) => {
  const lastOrderDate = item.lastOrderDate || null;
  const daysSinceOrder = daysSince(lastOrderDate);

  const paylater = item.paylater || null;
  const paylaterLimit = firstOf(
    paylater?.creditLimit,
    item.paylaterLimit,
    0,
  );
  const paylaterUsed = firstOf(
    paylater?.totalAmountUsed,
    paylater?.totalPayableAmount,
    item.paylaterUsed,
    0,
  );

  return {
    ...item,
    initials: initialsOf(item.name),
    formattedAddress: addressLine(item),
    lastOrderDate,
    daysSinceOrder,
    registeredOn: item.createdAt || null,
    isActiveBuyer: item.isActiveBuyer === true,

    bills: firstOf(item.bills, item.orderCount, item.totalOrders, 0),
    ltv: firstOf(item.ltv, item.lifetimeValue, item.totalOrderValue, 0),
    paylaterUsed,
    paylaterLimit,
    paylater,
  };
};

/**
 * B2B franchise directory page. The endpoint returns rows and pagination
 * together, so callers get the total from the same round trip.
 */
export const getData = async (
  params: Record<string, any>,
): Promise<FranchiseListResult> => {
  const response = await FranchiseService.getFranchiseDashboardList({
    ...params,
    outputType: "list",
  });
  const body = response?.data || {};
  const pagination = body.pagination || {};

  return {
    data: (body.data || []).map((item: any) => mapFranchise(item)),
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
  if (filter.segment && filter.segment !== "all") {
    params.filter.segment = filter.segment;
  }

  // Status filter — same flag the Status column renders (Active / Inactive).
  if (filter.status === "active") {
    params.filter.isActiveBuyer = true;
  } else if (filter.status === "inactive") {
    params.filter.isActiveBuyer = false;
  }

  // Registered-on range — filtered on the registration date the list shows.
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.filter.createdAt = {
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

export type FranchiseSummary = {
  total: number;
  totalLtv: number;
  cards: Record<string, LoyaltySummaryCard>;
};

const EMPTY_SUMMARY: FranchiseSummary = {
  total: 0,
  totalLtv: 0,
  cards: {},
};

/**
 * Directory tiles for the current filter set. Same `franchise/dashboard/franchises`
 * endpoint the table uses — `outputType: "loyaltySummary"` swaps the rows for
 * the aggregated figures, so pagination is dropped from the params.
 */
export async function getSummary(
  filters: Record<string, any>,
): Promise<FranchiseSummary> {
  // The tiles stay on the unsegmented totals — otherwise picking a tile would
  // zero out the other three and there would be no way back.
  const { segment, ...rest } = filters || {};
  const { page, limit, ...params } = prepareParams(rest);

  const response = await FranchiseService.getFranchiseDashboardList({
    ...params,
    outputType: "loyaltySummary",
  });
  const body = response?.data?.data;
  if (!body) return EMPTY_SUMMARY;

  return {
    total: body.totalFranchises || 0,
    totalLtv: body.totalLtv || 0,
    cards: body.cards || {},
  };
}
