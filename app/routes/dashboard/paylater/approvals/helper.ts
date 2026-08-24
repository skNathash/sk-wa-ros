import CommonService from "~/services/CommonService";
import PaylaterService from "~/services/PaylaterService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

/** Which side of the book the approval queue is showing. */
export type ApprovalUserType = "all" | "b2b" | "b2c";

export interface ApprovalFilterFormData {
  search: string;
  userType: ApprovalUserType;
  kycStatus: string;
  alpha: string;
}

export const defaultFilter: ApprovalFilterFormData = {
  search: "",
  userType: "all",
  kycStatus: "All",
  alpha: "",
};

/** URL user-type slice -> the `userInfo.type` the API stores. */
const USER_TYPE_MAP: Record<string, string> = {
  b2b: "franchise",
  b2c: "customer",
};

// Deterministic avatar tint per customer so the same person keeps a stable
// colour across the queue — same palette the wallet list uses.
const AVATAR_TINTS = [
  "tw:bg-amber-700",
  "tw:bg-rose-500",
  "tw:bg-red-500",
  "tw:bg-indigo-500",
  "tw:bg-emerald-600",
  "tw:bg-sky-600",
  "tw:bg-violet-600",
  "tw:bg-teal-600",
];

export const getInitial = (name?: string) =>
  (name || "").trim().charAt(0).toUpperCase() || "?";

export const getTint = (name?: string) => {
  const key = (name || "?").charCodeAt(0) || 0;
  return AVATAR_TINTS[key % AVATAR_TINTS.length];
};

/**
 * List params for the pending-approval queue. The status is not negotiable
 * here — the page only ever shows requests waiting on a decision — so it is
 * pinned rather than exposed through the filter.
 */
export const prepareParams = (
  filter: Partial<ApprovalFilterFormData>,
  pagination: PaginationState,
  sort: SortProps,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      status: "Pending",
    },
    isMyNetwork: true,
  };

  if (filter.userType && filter.userType !== "all") {
    params.filter["userInfo.type"] =
      USER_TYPE_MAP[filter.userType] || filter.userType;
  }

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { "userInfo.name": { $regex: search, $options: "i" } },
      { "userInfo.mobile": { $regex: search, $options: "i" } },
    ];
  }

  if (filter.alpha) {
    params.filter["userInfo.name"] = CommonService.prepareAlphaRegexFilter(
      filter.alpha,
    );
  }

  if (filter.kycStatus && filter.kycStatus !== "All") {
    params.filter.kycStatus = filter.kycStatus;
  }

  // Oldest request first is the useful default for a queue — the sort still
  // comes from the caller so the table header can flip it.
  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  return params;
};

/** One page of pending requests, formatted for the queue rows. */
export const getData = async (params: Record<string, any>) => {
  const response = await PaylaterService.getRequests(params);
  const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
  return PaylaterService.formatPaylaterRequest(rows).map((item: any) => ({
    ...item,
    // Everything in this list is still Pending, so the request view is the
    // only meaningful destination.
    viewBtnLink: `/dashboard/paylater/view/${item._id}`,
  }));
};

export async function getCount(params: Record<string, any>) {
  const { page, count, sort, ...restParams } = params;
  const resp = await PaylaterService.getRequests({
    ...restParams,
    outputType: "count",
  });
  return resp.data?.data?.count || 0;
}
