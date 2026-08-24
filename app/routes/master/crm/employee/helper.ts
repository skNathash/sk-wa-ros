import { endOfDay, startOfDay } from "date-fns";
import LeadFollowupService from "~/services/LeadFollowupService";

export interface EmployeeFilterForm {
  search: string;
  state: string;
  district: string;
  pincode: string;
  status: string;
  followUpDateRange: Date[];
  createdDateRange: Date[];
}

export const defaultFilter: EmployeeFilterForm = {
  search: "",
  state: "",
  district: "",
  pincode: "",
  status: "",
  followUpDateRange: [],
  createdDateRange: [],
};

export interface EmployeeSummary {
  totalFollowups: number;
  pendingFollowups: number;
  overdue: number;
  retailersContacted: number;
}

export const defaultSummary: EmployeeSummary = {
  totalFollowups: 0,
  pendingFollowups: 0,
  overdue: 0,
  retailersContacted: 0,
};

// Basic employee identity derived from the follow-up records.
export interface EmployeeDetails {
  // Raw employee record id used to scope the follow-up filter.
  id: string;
  employeeId: string;
  name: string;
  email: string;
}

// Sentinel status value for the "Overdue" tile. It is not a real follow-up
// status: it means the follow-up is still actionable (not Completed) and its
// follow-up date has already passed (i.e. it is due).
export const OVERDUE_STATUS = "Overdue";

// Mongo filter that matches overdue / due follow-ups. Delegated to the service
// so the summary count matches the per-row `_isFolloupDue` badge exactly.
const overdueFilter = () => LeadFollowupService.getDueFilter();

const isSet = (value?: string) => !!value && value.trim() && value !== "All";

// Fetch the employee's follow-up summary in a single call via the grouped
// summary endpoint in summary mode (outputType: "summary"), scoped to this
// employee. Returns the pre-aggregated totals the header tiles display.
export const getSummary = async (
  employeeId: string,
  filter: Partial<EmployeeFilterForm>,
): Promise<EmployeeSummary> => {
  // The tiles are status-agnostic (each is its own metric), so clear the
  // selected status before aggregating — otherwise picking a tile would scope
  // every tile to that status.
  const summaryFilter = { ...filter, status: "" };
  const params = prepareRetailerParams(employeeId, summaryFilter, 1, 1);

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

// ---- Retailer (franchise) grouped summary, scoped to one employee ----

// One aggregated row: a retailer this employee has follow-ups against, with the
// per-status counts flattened from the grouped-summary endpoint.
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
  // Number of store notes ("times contacted") this employee has logged against
  // the retailer.
  timesContacted: number;
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  escalated: number;
  overdue: number;
  // Per-count deep links into the retailer overview, each pre-scoped to the
  // status the tapped number represents. Absent when there's no franchise id
  // to link to.
  links?: RetailerLinks;
}

// The retailer-overview deep links for the three clickable counts. `total`
// carries no status (the retailer's whole activity feed); `pending` and
// `overdue` open the timeline pre-filtered.
export interface RetailerLinks {
  total: string;
  pending: string;
  overdue: string;
}

// Options that scope a retailer-overview deep link: the follow-up status the
// timeline should open pre-filtered to, plus the employee whose follow-ups the
// counts represent so the retailer feed can be scoped to that employee.
interface RetailerLinkScope {
  status?: string;
  employeeId?: string;
  employeeName?: string;
}

// Build a link into the retailer overview page. Always carries the franchise id;
// when given, also carries the follow-up status ("Overdue" is the sentinel the
// retailer page translates into the shared due-date condition) and the employee
// scope (id used to filter the feed, name only to label the filter chip).
const buildRetailerLink = (
  franchiseId: string,
  scope?: RetailerLinkScope,
): string => {
  const params = new URLSearchParams();
  params.set("id", franchiseId);
  if (scope?.status) params.set("status", scope.status);
  if (scope?.employeeId) params.set("employeeId", scope.employeeId);
  if (scope?.employeeName) params.set("employeeName", scope.employeeName);
  return `/master/crm/retailer?${params.toString()}`;
};

// Precompute the three per-count deep links for a retailer row. Every link is
// scoped to the current employee; Pending maps to the "Open" status (mirroring
// the dashboard's pending link) and Overdue to the compound-due sentinel.
// Returns undefined when there's no franchise id to link to.
const buildRetailerLinks = (
  franchiseId: string,
  employeeId?: string,
  employeeName?: string,
): RetailerLinks | undefined => {
  if (!franchiseId) return undefined;
  const base: RetailerLinkScope = { employeeId, employeeName };
  return {
    total: buildRetailerLink(franchiseId, base),
    pending: buildRetailerLink(franchiseId, { ...base, status: "Open" }),
    overdue: buildRetailerLink(franchiseId, { ...base, status: OVERDUE_STATUS }),
  };
};

// Build the grouped-summary request params. Groups by franchise and always
// scopes to the current employee via the nested `employee.refId` path (the same
// scope the flat list uses) so the retailer table and the summary tiles agree.
// The location / search / status / date filters mirror prepareParams above.
export const prepareRetailerParams = (
  employeeId: string,
  filter: Partial<EmployeeFilterForm>,
  page: number,
  limit: number,
) => {
  const params: Record<string, any> = {
    groupBy: "franchise",
    page,
    limit,
    filter: {
      "employee.refId": employeeId,
    },
  };

  const search = filter.search?.trim();
  if (search) {
    // The grouped-summary endpoint takes a plain search string it matches
    // server-side, unlike the flat list's explicit $or.
    params.filter.search = search;
  }

  if (isSet(filter.state)) params.filter.state = filter.state?.trim();
  if (isSet(filter.district)) params.filter.district = filter.district?.trim();

  const pincode = filter.pincode?.trim();
  if (pincode) {
    params.filter.pincode = pincode;
  }

  const isOverdue = filter.status?.trim() === OVERDUE_STATUS;
  if (isOverdue) {
    // "Overdue" is a compound condition (status + past due date), so translate
    // the sentinel into the real filter and ignore the plain status match.
    Object.assign(params.filter, overdueFilter());
  } else if (isSet(filter.status)) {
    params.filter.status = filter.status?.trim();
  }

  // The overdue date window is fixed (before today), so the picked follow-up
  // date range only applies to the non-overdue views.
  if (
    !isOverdue &&
    Array.isArray(filter.followUpDateRange) &&
    filter.followUpDateRange.length === 2
  ) {
    params.filter.followUpDateTime = {
      $gte: startOfDay(filter.followUpDateRange[0]),
      $lte: endOfDay(filter.followUpDateRange[1]),
    };
  }

  if (
    Array.isArray(filter.createdDateRange) &&
    filter.createdDateRange.length === 2
  ) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.createdDateRange[0]),
      $lte: endOfDay(filter.createdDateRange[1]),
    };
  }

  return params;
};

// Normalize one raw grouped-summary row into a RetailerSummaryRow, flattening
// its status breakdown via the shared service helper. The employee scope is
// baked into the per-count deep links so the retailer feed opens filtered to
// this employee.
const formatRetailerRow = (
  row: any,
  employeeId?: string,
  employeeName?: string,
): RetailerSummaryRow => ({
  id: row?.franchiseId || "",
  franchiseRefId: row?.franchiseRefId || "",
  franchiseName: row?.franchiseName || "-",
  state: row?.state || "",
  district: row?.district || "",
  town: row?.town || "",
  pincode: row?.pincode ?? "",
  mobileNo: row?.mobileNo || "",
  lastLoggedOn: row?.lastLoggedOn || "",
  timesContacted: Number(row?.timesContacted ?? 0),
  ...LeadFollowupService.formatSummaryCounts(row),
  links: buildRetailerLinks(row?.franchiseId || "", employeeId, employeeName),
});

// Fetch a page of retailer-grouped summary rows for this employee plus the total
// group count. Rows sit at data.data and the total at data.pagination.total.
export const getRetailers = async (
  params: Record<string, any>,
  employeeName?: string,
): Promise<{ data: RetailerSummaryRow[]; total: number }> => {
  const response = await LeadFollowupService.getGroupedSummary(params);
  const rows = response?.data?.data || [];
  // The employee scope the rows are already filtered by, reused to scope each
  // row's retailer deep links.
  const employeeId = params?.filter?.["employee.refId"] || "";
  const data: RetailerSummaryRow[] = rows.map((row: any) =>
    formatRetailerRow(row, employeeId, employeeName),
  );

  return {
    data,
    total: response?.data?.pagination?.total ?? rows.length,
  };
};

// Resolve the employee's basic identity from the employee/{id} endpoint.
// Returns null when the employee cannot be resolved.
export const getEmployee = async (
  employeeId: string,
): Promise<EmployeeDetails | null> => {
  if (!employeeId) return null;

  const response = await LeadFollowupService.getEmployeeById(employeeId);
  const emp = response?.data?.data;
  if (!emp) return null;

  const name = emp.name || "";
  const email = emp.email || "";
  // The follow-up list filters by the employee record's own Mongo id, which the
  // detail endpoint returns as `_id`. The human-readable code is `referenceId`
  // (e.g. "EMP45"), shown as the Employee ID.
  const id = emp._id;
  const resolvedId = emp.referenceId;
  if (!name && !id) return null;

  return {
    id,
    employeeId: resolvedId,
    name,
    email,
  };
};
