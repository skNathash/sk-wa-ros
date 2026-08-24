import LeadFollowupService from "~/services/LeadFollowupService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

// The "All activity" timeline filter. The default ("all") applies NO followType
// filter — the unified feed of notes + follow-ups.
export type ActivityType = "all" | "followups" | "notes";

export const ACTIVITY_TYPE_OPTIONS: Array<{ value: ActivityType; label: string }> =
  [
    { value: "all", label: "All activity" },
    { value: "followups", label: "Follow-ups" },
    { value: "notes", label: "Notes" },
  ];

// Sentinel status carried in the deep link from the employee page's Overdue
// count. It is not a real follow-up status — it means still-actionable
// follow-ups whose date has already passed — so it translates into the shared
// due-date condition rather than a plain status match.
export const OVERDUE_STATUS = "Overdue";

// Build the API request params for the activity list. The franchise id scopes
// the feed to one retailer. The followType split is applied by the service based
// on `type` (getActivity = no filter, getFollowups / getNotes = split). An
// optional `status` narrows the feed to follow-ups in that status, and an
// optional `employeeRefId` narrows it to one employee's follow-ups (both only
// meaningful for the follow-ups list, which the caller enforces).
export const prepareParams = (
  franchiseId: string,
  pagination: PaginationState,
  sort?: { key: string; value: SortValue },
  status?: string,
  employeeRefId?: string,
) => {
  const filter: Record<string, any> = { franchiseId };
  if (status === OVERDUE_STATUS) {
    Object.assign(filter, LeadFollowupService.getDueFilter());
  } else if (status) {
    filter.status = status;
  }
  // Scope to a single employee's follow-ups (nested ref path, same as the
  // grouped summary uses).
  if (employeeRefId) filter["employee.refId"] = employeeRefId;
  return {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: sort?.key ? { [sort.key]: sort.value === "asc" ? 1 : -1 } : undefined,
    filter,
  } as Record<string, any>;
};

// Pick the right service call for the selected activity type.
const listFor = (params: Record<string, any>, type: ActivityType) => {
  if (type === "followups") return LeadFollowupService.getFollowups(params);
  if (type === "notes") return LeadFollowupService.getNotes(params);
  return LeadFollowupService.getActivity(params);
};

const countFor = (params: Record<string, any>, type: ActivityType) => {
  if (type === "followups") return LeadFollowupService.getFollowupsCount(params);
  if (type === "notes") return LeadFollowupService.getNotesCount(params);
  return LeadFollowupService.getActivityCount(params);
};

// Fetch an activity page for the selected type. Rows are decorated with the
// note / follow-up flags and status metadata the timeline renders.
export const getData = async (
  params: Record<string, any>,
  type: ActivityType = "all",
) => {
  const response = await listFor(params, type);
  return LeadFollowupService.formatActivityResponse(response?.data?.data || []);
};

// Fetch the total count (outputType: "count") for the selected type.
export const getCount = async (
  params: Record<string, any>,
  type: ActivityType = "all",
) => {
  const { page, count, sort, ...rest } = params || {};
  const response = await countFor(rest, type);
  return typeof response?.count === "number" ? response.count : 0;
};

// The retailer's current open follow-up thread, if any. Only one open follow-up
// is allowed per retailer at a time (status !== "Completed"), so this both gates
// the add-lead flow and feeds the Next follow-up card. Returns the earliest
// scheduled open follow-up (the one that needs attention next), or null.
export const getOpenFollowUp = async (
  franchiseId: string,
): Promise<any | null> => {
  const response = await LeadFollowupService.getFollowups({
    page: 1,
    count: 1,
    // Earliest upcoming/overdue follow-up first.
    sort: { followUpDateTime: 1 },
    filter: {
      franchiseId,
      status: { $ne: "Completed" },
    },
  });
  const rows = LeadFollowupService.formatFollowupResponse(
    response?.data?.data || [],
  );
  return rows[0] || null;
};
