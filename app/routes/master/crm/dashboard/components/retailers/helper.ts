import { endOfDay, format, startOfDay } from "date-fns";
import LeadFollowupService from "~/services/LeadFollowupService";

// Filters that scope the franchise (retailer) wise follow-up summary.
export interface RetailerSummaryFilterForm {
  search: string;
  state: string;
  district: string;
  pincode: string;
  // Follow-up status the summary tiles filter by. Empty means "all statuses"
  // (the Total tile); "Overdue" is a compound due-date condition, not a real
  // status (see prepareParams).
  status: string;
  createdDateRange: Date[];
  // Follow-up date range (yyyy-MM-dd round-trip). Scopes the summary to
  // retailers with a follow-up due in the range, e.g. the Today's-Open preset.
  followUpDateRange: Date[];
}

export const defaultFilter: RetailerSummaryFilterForm = {
  search: "",
  state: "",
  district: "",
  pincode: "",
  status: "",
  createdDateRange: [],
  followUpDateRange: [],
};

// Sentinel status for the "Overdue" tile. It is not a real follow-up status:
// it means still-actionable follow-ups whose date has already passed, so it
// translates into the shared due-date filter instead of a plain status match.
export const OVERDUE_STATUS = "Overdue";

// One aggregated row: a retailer (franchise) with their follow-up status counts.
export interface RetailerSummaryRow {
  // Franchise id used to deep-link into the retailer follow-up page.
  id: string;
  franchiseRefId: string;
  franchiseName: string;
  state: string;
  district: string;
  town: string;
  pincode: string | number;
  mobileNo: string;
  lastLoggedOn: string;
  // Name of the employee behind the most recent follow-up ("contacted by").
  // Prefers whoever last modified the follow-up, falling back to its creator.
  lastContactBy: string;
  // Number of store notes logged against this retailer.
  timesContacted: number;
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  escalated: number;
  overdue: number;
  // Per-status deep links, precomputed with the active created-on range.
  // Absent when the row has no franchise id to link to.
  links?: Record<SummaryColumn, string>;
  // The retailer's earliest upcoming still-open follow-up plus the employee it
  // is assigned to. Absent when the retailer has no upcoming follow-up.
  nextFollowup?: {
    followUpDateTime: string;
    employeeName: string;
  };
}

const isSet = (value?: string) => !!value && value !== "All";

// A clickable summary count column. "total" shows every status.
export type SummaryColumn = "total" | "open" | "inProgress" | "completed";

// Map a summary count column to the follow-up status the retailer detail page
// filters by. "total" deliberately carries no status (shows everything).
const STATUS_BY_COLUMN: Partial<Record<SummaryColumn, string>> = {
  open: "Open",
  inProgress: "InProgress",
  completed: "Completed",
};

// Deep link into the retailer follow-up page for one status count, carrying the
// retailer id and the active created-on date range so the detail view opens
// pre-filtered to exactly what the tapped number represents.
const buildStatusLink = (
  franchiseId: string,
  column: SummaryColumn,
  dateRange?: Date[],
): string => {
  const params = new URLSearchParams();
  params.set("id", franchiseId);
  const status = STATUS_BY_COLUMN[column];
  if (status) params.set("status", status);
  if (Array.isArray(dateRange) && dateRange.length === 2) {
    params.set("startDate", format(dateRange[0], "yyyy-MM-dd"));
    params.set("endDate", format(dateRange[1], "yyyy-MM-dd"));
  }
  return `/master/crm/retailer?${params.toString()}`;
};

// Precompute the four per-status deep links for a row, all sharing the active
// created-on range. Returns undefined when there is no id to link to.
const buildRowLinks = (
  franchiseId: string,
  dateRange?: Date[],
): Record<SummaryColumn, string> | undefined => {
  if (!franchiseId) return undefined;
  return {
    total: buildStatusLink(franchiseId, "total", dateRange),
    open: buildStatusLink(franchiseId, "open", dateRange),
    inProgress: buildStatusLink(franchiseId, "inProgress", dateRange),
    completed: buildStatusLink(franchiseId, "completed", dateRange),
  };
};

// Build the summary request params. The endpoint groups by franchise and
// paginates with page + limit; the location / search / date filters mirror the
// follow-up list so the two views stay consistent.
export const prepareParams = (
  filter: Partial<RetailerSummaryFilterForm>,
  page: number,
  limit: number,
) => {
  const params: Record<string, any> = {
    groupBy: "franchise",
    page,
    limit,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.search = search;
  }

  if (isSet(filter.state)) params.filter.state = filter.state?.trim();
  if (isSet(filter.district)) params.filter.district = filter.district?.trim();

  const pincode = filter.pincode?.trim();
  if (pincode) {
    params.filter.pincode = pincode;
  }

  const status = filter.status?.trim();
  if (status === OVERDUE_STATUS) {
    // "Overdue" is a compound condition (still open + past due date), so overlay
    // the shared due-date filter instead of matching a plain status.
    Object.assign(params.filter, LeadFollowupService.getDueFilter());
  } else if (status && status !== "All") {
    params.filter.status = status;
  }

  if (
    Array.isArray(filter.createdDateRange) &&
    filter.createdDateRange.length === 2
  ) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.createdDateRange[0]).toISOString(),
      $lte: endOfDay(filter.createdDateRange[1]).toISOString(),
    };
  }

  if (
    Array.isArray(filter.followUpDateRange) &&
    filter.followUpDateRange.length === 2
  ) {
    params.filter.followUpDateTime = {
      $gte: startOfDay(filter.followUpDateRange[0]).toISOString(),
      $lte: endOfDay(filter.followUpDateRange[1]).toISOString(),
    };
  }

  return params;
};

// Normalize one raw summary row into a RetailerSummaryRow, attaching the
// per-status deep links scoped to the active created-on range.
const formatRow = (row: any, dateRange?: Date[]): RetailerSummaryRow => {
  const id = row?.franchiseId || "";
  const next = row?.nextFollowup;
  return {
    id,
    franchiseRefId: row?.franchiseRefId || "",
    franchiseName: row?.franchiseName || "-",
    state: row?.state || "",
    district: row?.district || "",
    town: row?.town || "",
    pincode: row?.pincode ?? "",
    mobileNo: row?.mobileNo || "",
    lastLoggedOn: row?.lastLoggedOn || "",
    lastContactBy:
      row?.lastFollowup?.modifiedBy?.name ||
      row?.lastFollowup?.createdBy?.name ||
      "",
    timesContacted: Number(row?.timesContacted ?? 0),
    ...LeadFollowupService.formatSummaryCounts(row),
    links: buildRowLinks(id, dateRange),
    nextFollowup: next?.followUpDateTime
      ? {
          followUpDateTime: next.followUpDateTime,
          employeeName: next.assignedTo?.name || "",
        }
      : undefined,
  };
};

// Fetch a page of franchise-wise summary rows plus the total group count. The
// active filter is threaded through so each row carries its deep links
// pre-scoped to the current created-on range.
export const getData = async (
  params: Record<string, any>,
  filter?: Partial<RetailerSummaryFilterForm>,
): Promise<{ data: RetailerSummaryRow[]; total: number }> => {
  const response = await LeadFollowupService.getGroupedSummary(params);
  const rows = response?.data?.data || [];
  return {
    data: rows.map((row: any) => formatRow(row, filter?.createdDateRange)),
    total: response?.data?.pagination?.total ?? rows.length,
  };
};

// Aggregate follow-up metrics across every retailer, shown as the header tiles.
export interface DashboardSummary {
  totalFollowups: number;
  pendingFollowups: number;
  overdue: number;
  retailersContacted: number;
}

export const defaultSummary: DashboardSummary = {
  totalFollowups: 0,
  pendingFollowups: 0,
  overdue: 0,
  retailersContacted: 0,
};

// Fetch the header summary in a single call via the grouped-summary endpoint in
// summary mode (outputType: "summary"), which returns the pre-aggregated totals
// instead of the per-retailer rows. Honours the same location / search /
// created-on filters as the list below.
export const getSummary = async (
  filter: Partial<RetailerSummaryFilterForm>,
): Promise<DashboardSummary> => {
  // The tiles are status-agnostic (each is its own metric), so clear the
  // selected status before aggregating — otherwise picking a tile would scope
  // every tile to that status.
  const summaryFilter = { ...filter, status: "" };
  const params = prepareParams(summaryFilter, 1, 1);

  const response = await LeadFollowupService.getGroupedSummary({
    ...params,
    outputType: "summary",
  });
  const data = response?.data?.data || {};

  return {
    totalFollowups: Number(data.totalFollowups ?? 0),
    pendingFollowups: Number(data.pendingFollowups ?? 0),
    overdue: Number(data.overdue ?? 0),
    retailersContacted: Number(data.retailersContacted ?? 0),
  };
};
