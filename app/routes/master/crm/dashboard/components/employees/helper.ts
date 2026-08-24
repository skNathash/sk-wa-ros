import { endOfDay, format, startOfDay } from "date-fns";
import LeadFollowupService from "~/services/LeadFollowupService";

// Filters that scope the employee-wise follow-up summary.
export interface EmployeeSummaryFilterForm {
  search: string;
  // Follow-up status the summary tiles filter by. Empty means "all statuses"
  // (the Total tile); "Overdue" is a compound due-date condition, not a real
  // status (see prepareParams).
  status: string;
  createdDateRange: Date[];
}

export const defaultFilter: EmployeeSummaryFilterForm = {
  search: "",
  status: "",
  createdDateRange: [],
};

// Sentinel status for the "Overdue" tile. It is not a real follow-up status:
// it means still-actionable follow-ups whose date has already passed, so it
// translates into the shared due-date filter instead of a plain status match.
export const OVERDUE_STATUS = "Overdue";

// One aggregated row: an employee with their follow-up status counts.
export interface EmployeeSummaryRow {
  // Employee reference id used to deep-link into the employee follow-up page
  // (matches the `id` param that page resolves via employee/{id}).
  id: string;
  employeeId: string;
  name: string;
  email: string;
  lastLoggedOn: string;
  // The retailer the most recent follow-up was against. Used to render (and
  // deep-link to) the franchise below the last follow-up date. Absent when the
  // employee has no follow-up yet.
  lastFollowup?: {
    franchiseName: string;
    franchiseId: string;
    mobileNo: string;
  };
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  escalated: number;
  overdue: number;
  // Count of distinct retailers this employee has logged follow-ups against.
  retailersContacted: number;
  // Per-status deep links, precomputed with the active follow-up range.
  // Absent when the row has no employee id to link to.
  links?: Record<SummaryColumn, string>;
  // The employee's earliest upcoming still-open follow-up plus the retailer it
  // is against. Absent when the employee has no upcoming follow-up.
  nextFollowup?: {
    followUpDateTime: string;
    franchiseName: string;
    franchiseId: string;
  };
}

// A clickable summary count column. "total" shows every status.
export type SummaryColumn = "total" | "open" | "inProgress" | "completed";

// Map a summary count column to the follow-up status the employee detail page
// filters by. "total" deliberately carries no status (shows everything).
const STATUS_BY_COLUMN: Partial<Record<SummaryColumn, string>> = {
  open: "Open",
  inProgress: "InProgress",
  completed: "Completed",
};

// Deep link into the employee follow-up page for one status count, carrying the
// employee id and the active created-on date range so the detail view opens
// pre-filtered to exactly what the tapped number represents.
const buildStatusLink = (
  employeeId: string,
  column: SummaryColumn,
  dateRange?: Date[],
): string => {
  const params = new URLSearchParams();
  params.set("id", employeeId);
  const status = STATUS_BY_COLUMN[column];
  if (status) params.set("status", status);
  if (Array.isArray(dateRange) && dateRange.length === 2) {
    params.set("startDate", format(dateRange[0], "yyyy-MM-dd"));
    params.set("endDate", format(dateRange[1], "yyyy-MM-dd"));
  }
  return `/master/crm/employee?${params.toString()}`;
};

// Precompute the four per-status deep links for a row, all sharing the active
// created-on range. Returns undefined when there is no id to link to.
const buildRowLinks = (
  employeeId: string,
  dateRange?: Date[],
): Record<SummaryColumn, string> | undefined => {
  if (!employeeId) return undefined;
  return {
    total: buildStatusLink(employeeId, "total", dateRange),
    open: buildStatusLink(employeeId, "open", dateRange),
    inProgress: buildStatusLink(employeeId, "inProgress", dateRange),
    completed: buildStatusLink(employeeId, "completed", dateRange),
  };
};

// Build the summary request params. The endpoint groups by employee and
// paginates with page + limit; the search + created-on date filters mirror the
// follow-up list so the two views stay consistent.
export const prepareParams = (
  filter: Partial<EmployeeSummaryFilterForm>,
  page: number,
  limit: number,
) => {
  const params: Record<string, any> = {
    groupBy: "employee",
    page,
    limit,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.search = search;
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

  return params;
};

// Normalize one raw summary row into an EmployeeSummaryRow, attaching the
// per-status deep links scoped to the active created-on range.
const formatRow = (row: any, dateRange?: Date[]): EmployeeSummaryRow => {
  const id = row?.employeeRefId || "";
  const lastFollowup = row?.lastFollowup;
  const next = row?.nextFollowup;
  return {
    id,
    employeeId: row?.employeeId || "",
    name: row?.employeeName || "-",
    email: row?.employeeEmail || "",
    lastLoggedOn: row?.lastLoggedOn || "",
    lastFollowup: lastFollowup
      ? {
          franchiseName: lastFollowup.franchiseName || "",
          franchiseId: lastFollowup.franchiseId || "",
          mobileNo: lastFollowup.mobileNo || "",
        }
      : undefined,
    ...LeadFollowupService.formatSummaryCounts(row),
    retailersContacted: Number(row?.retailersContacted ?? 0),
    links: buildRowLinks(id, dateRange),
    nextFollowup: next?.followUpDateTime
      ? {
          followUpDateTime: next.followUpDateTime,
          franchiseName: next.franchiseName || "",
          franchiseId: next.franchiseId || "",
        }
      : undefined,
  };
};

// Fetch a page of employee-wise summary rows plus the total group count. The
// active filter is threaded through so each row carries its deep links
// pre-scoped to the current created-on range.
export const getData = async (
  params: Record<string, any>,
  filter?: Partial<EmployeeSummaryFilterForm>,
): Promise<{ data: EmployeeSummaryRow[]; total: number }> => {
  const response = await LeadFollowupService.getGroupedSummary(params);
  const rows = response?.data?.data || [];
  return {
    data: rows.map((row: any) => formatRow(row, filter?.createdDateRange)),
    total: response?.data?.pagination?.total ?? rows.length,
  };
};

// Aggregate follow-up metrics across every employee, shown as the header tiles.
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
// instead of the per-employee rows. Honours the same search / created-on
// filters as the list below.
export const getSummary = async (
  filter: Partial<EmployeeSummaryFilterForm>,
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
