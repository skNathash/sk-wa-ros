import { endOfDay, startOfDay } from "date-fns";
import LeadFollowupService from "~/services/LeadFollowupService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export interface DashboardFilterForm {
  search: string;
  state: string;
  district: string;
  pincode: string;
  employeeId: string;
  employeeName: string;
  status: string;
  followUpDateRange: Date[];
  createdDateRange: Date[];
}

export const defaultFilter: DashboardFilterForm = {
  search: "",
  state: "",
  district: "",
  pincode: "",
  employeeId: "",
  employeeName: "",
  status: "",
  followUpDateRange: [],
  createdDateRange: [],
};

export interface DashboardSummary {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  overdue: number;
}

export const defaultSummary: DashboardSummary = {
  total: 0,
  open: 0,
  inProgress: 0,
  closed: 0,
  overdue: 0,
};

// The follow-up statuses we surface as summary tiles.
export const SUMMARY_STATUSES = ["Open", "InProgress", "Completed"] as const;

// Sentinel status value for the "Overdue" tile. It is not a real follow-up
// status: it means the follow-up is still actionable (not Completed) and its
// follow-up date has already passed (i.e. it is due).
export const OVERDUE_STATUS = "Overdue";

// Mongo filter that matches overdue / due follow-ups. Delegated to the service
// so the summary count matches the per-row `_isFolloupDue` badge exactly.
const overdueFilter = () => LeadFollowupService.getDueFilter();

const isSet = (value?: string) => !!value && value.trim() && value !== "All";

// Build the API request params from the current filter + pagination state.
export const prepareParams = (
  filter: Partial<DashboardFilterForm>,
  pagination: PaginationState,
  sort?: { key: string; value: SortValue },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: sort?.key
      ? { [sort.key]: sort.value === "asc" ? 1 : -1 }
      : { createdAt: -1 },
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    // Text search is delegated to the server, which matches across the
    // follow-up's franchise id, franchise name and mobile number.
    params.filter.search = search;
  }

  if (isSet(filter.state)) {
    params.filter.state = filter.state?.trim();
  }

  if (isSet(filter.district)) {
    params.filter.district = filter.district?.trim();
  }

  const pincode = filter.pincode?.trim();
  if (pincode) {
    const numeric = Number(pincode);
    params.filter.pincode = Number.isNaN(numeric) ? pincode : numeric;
  }

  // Follow-up records embed the employee as a nested object, so a picked
  // employee scopes the list by the nested `employee.refId` path.
  const employeeId = filter.employeeId?.trim();
  if (employeeId) {
    params.filter["employee.refId"] = employeeId;
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
      $gte: startOfDay(filter.followUpDateRange[0]).toISOString(),
      $lte: endOfDay(filter.followUpDateRange[1]).toISOString(),
    };
  }

  // Created-on range is independent of the overdue view, so it always applies.
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

// Fetch the list. lead-followup/list returns the array at data.data.
export const getData = async (params: Record<string, any>) => {
  const response = await LeadFollowupService.getList(params);
  return LeadFollowupService.formatFollowupResponse(response?.data?.data || []);
};

// Fetch the total count (outputType: "count") from pagination.total.
export const getCount = async (params: Record<string, any>) => {
  const { page, count, sort, ...rest } = params || {};
  const response = await LeadFollowupService.getListCount(rest);
  return typeof response?.count === "number" ? response.count : 0;
};

// Build the summary block by calling getCount once per status filter (3 calls),
// then deriving the overall total from them.
export const getSummary = async (
  filter: Partial<DashboardFilterForm>,
): Promise<DashboardSummary> => {
  // Each summary card derives its own status count, so the base params must be
  // status-agnostic. Clearing the status keeps the currently-selected card
  // (especially "Overdue", whose past-due date window would otherwise leak in)
  // from constraining the counts of the other cards.
  const baseParams = prepareParams(
    { ...filter, status: "" },
    {
      activePage: 1,
      rowsPerPage: 1,
      startSlNo: 1,
      endSlNo: 1,
      totalRecords: 0,
    },
  );

  const [open, inProgress, closed, overdue] = await Promise.all([
    ...SUMMARY_STATUSES.map((status) =>
      getCount({
        ...baseParams,
        filter: { ...baseParams.filter, status },
      }),
    ),
    getCount({
      ...baseParams,
      filter: { ...baseParams.filter, ...overdueFilter() },
    }),
  ]);

  return {
    open,
    inProgress,
    closed,
    overdue,
    // Overdue overlaps Open / In Progress, so it is excluded from the total.
    total: open + inProgress + closed,
  };
};
