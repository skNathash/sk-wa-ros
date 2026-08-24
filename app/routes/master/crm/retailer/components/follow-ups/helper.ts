import { endOfDay, startOfDay } from "date-fns";
import LeadFollowupService from "~/services/LeadFollowupService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export interface RetailerFilterForm {
  search: string;
  type: string;
  status: string;
  dateRange: Date[];
  followUpRange: Date[];
}

export const defaultFilter: RetailerFilterForm = {
  search: "",
  type: "",
  status: "",
  dateRange: [],
  followUpRange: [],
};

export interface RetailerSummary {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  overdue: number;
}

export const defaultSummary: RetailerSummary = {
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
// so the per-row `_isFolloupDue` badge stays in sync with the list filter.
const overdueFilter = () => LeadFollowupService.getDueFilter();

// Overdue count sourced from the backend grouped-summary — the exact same value
// (and payload) the dashboard stat cards show — so the retailer's overdue count
// matches the dashboard instead of the client-side due filter. The backend owns
// the overdue definition here.
const getFranchiseOverdue = async (
  franchiseId: string,
  baseFilter: Record<string, any>,
): Promise<number> => {
  const response = await LeadFollowupService.getGroupedSummary({
    groupBy: "franchise",
    page: 1,
    limit: 1,
    outputType: "summary",
    filter: { ...baseFilter, franchiseId },
  });
  return Number(response?.data?.data?.overdue ?? 0);
};

const isSet = (value?: string) => !!value && value.trim() && value !== "All";

// Build the API request params from the current filter + pagination state.
// The franchise id is always applied so the list is scoped to one retailer.
export const prepareParams = (
  franchiseId: string,
  filter: Partial<RetailerFilterForm>,
  pagination: PaginationState,
  sort?: { key: string; value: SortValue },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: sort?.key
      ? { [sort.key]: sort.value === "asc" ? 1 : -1 }
      : { createdAt: -1 },
    filter: {
      franchiseId,
    },
  };

  const search = filter.search?.trim();
  if (search) {
    // Search across employee name, remarks and reference number.
    params.filter.search = search;
  }

  if (isSet(filter.type)) {
    params.filter.type = filter.type?.trim();
  }

  const isOverdue = filter.status?.trim() === OVERDUE_STATUS;

  if (isOverdue) {
    // "Overdue" is a compound condition (status + past due date), so translate
    // the sentinel into the real filter and ignore the plain status match.
    Object.assign(params.filter, overdueFilter());
  } else if (isSet(filter.status)) {
    params.filter.status = filter.status?.trim();
  }

  // Created-on range is independent of the overdue view, so it always applies.
  if (Array.isArray(filter.dateRange) && filter.dateRange.length === 2) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  // The overdue date window is fixed (before today), so the picked follow-up
  // range only applies to the non-overdue views.
  if (
    !isOverdue &&
    Array.isArray(filter.followUpRange) &&
    filter.followUpRange.length === 2
  ) {
    params.filter.followUpDateTime = {
      $gte: startOfDay(filter.followUpRange[0]),
      $lte: endOfDay(filter.followUpRange[1]),
    };
  }

  return params;
};

// Fetch the follow-up list for a franchise (notes excluded). lead-followup/list
// returns data.data.
export const getData = async (params: Record<string, any>) => {
  const response = await LeadFollowupService.getFollowups(params);
  return LeadFollowupService.formatFollowupResponse(response?.data?.data || []);
};

// Fetch the total count (outputType: "count") from pagination.total.
export const getCount = async (params: Record<string, any>) => {
  const { page, count, sort, ...rest } = params || {};
  const response = await LeadFollowupService.getFollowupsCount(rest);
  return typeof response?.count === "number" ? response.count : 0;
};

// Count the retailer's still-open (not Closed) follow-ups, ignoring the active
// search / type / date filters. This drives whether a *new* follow-up can be
// started: only one open follow-up thread is allowed per retailer at a time, so
// the "New follow-up" button is gated on this being zero regardless of what the
// user is currently filtering the list down to.
export const getActiveCount = async (franchiseId: string): Promise<number> => {
  return getCount({
    filter: {
      franchiseId,
      status: { $ne: "Completed" },
    },
  });
};

// Count the retailer's Open follow-ups, ignoring the active list filters. Drives
// the "Follow-ups" tab badge so the open workload is visible from either tab.
export const getOpenCount = async (franchiseId: string): Promise<number> => {
  return getCount({
    filter: {
      franchiseId,
      status: "Open",
    },
  });
};

// Build the summary block by counting follow-ups per status for this retailer,
// then deriving the overall total from them.
export const getSummary = async (
  franchiseId: string,
  filter: Partial<RetailerFilterForm>,
): Promise<RetailerSummary> => {
  // Each summary card derives its own status count, so the base params must be
  // status-agnostic. Clearing the status keeps the currently-selected card
  // (especially "Overdue", whose past-due date window would otherwise leak in)
  // from constraining the counts of the other cards.
  const baseParams = prepareParams(
    franchiseId,
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
    // Overdue mirrors the dashboard stat card (backend grouped-summary) rather
    // than being counted client-side, so both views report the same number.
    getFranchiseOverdue(franchiseId, baseParams.filter),
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
