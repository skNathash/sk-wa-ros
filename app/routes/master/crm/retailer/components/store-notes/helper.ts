import { endOfDay, startOfDay } from "date-fns";
import LeadFollowupService from "~/services/LeadFollowupService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export interface NoteFilterForm {
  search: string;
  dateRange: Date[];
}

export const defaultFilter: NoteFilterForm = {
  search: "",
  dateRange: [],
};

// Build the API request params from the current filter + pagination state.
// The franchise id scopes the list to one retailer; the NOTE follow-type filter
// is applied by the service (getNotes / getNotesCount).
export const prepareParams = (
  franchiseId: string,
  filter: Partial<NoteFilterForm>,
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
    // Text search is delegated to the server (matches remarks / author).
    params.filter.search = search;
  }

  if (Array.isArray(filter.dateRange) && filter.dateRange.length === 2) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  return params;
};

// Fetch the notes list. lead-followup/list returns the array at data.data.
// Each row is enriched with an `initial` derived from the author's name so the
// timeline can render the avatar without recomputing it per render.
export const getData = async (params: Record<string, any>) => {
  const response = await LeadFollowupService.getNotes(params);
  const rows = response?.data?.data || [];
  return rows.map((row: any) => ({
    ...row,
    initial: LeadFollowupService.getInitials(row?.employee?.name),
  }));
};

// Fetch the total count (outputType: "count") from pagination.total.
export const getCount = async (params: Record<string, any>) => {
  const { page, count, sort, ...rest } = params || {};
  const response = await LeadFollowupService.getNotesCount(rest);
  return typeof response?.count === "number" ? response.count : 0;
};
