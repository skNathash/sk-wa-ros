import { startOfDay, endOfDay, addDays } from "date-fns";
import CommonService from "~/services/CommonService";
import PaylaterService from "~/services/PaylaterService";
import type { PaginationState } from "~/types/CommonTypes";

/** How far ahead the "Due soon" slice looks. */
export const DUE_SOON_DAYS = 7;

// Deterministic avatar tint per customer so the same person keeps a stable colour.
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

/** First letter of the customer name, used inside the avatar disc. */
export const getInitial = (name?: string) =>
  (name || "").trim().charAt(0).toUpperCase() || "?";

export const getTint = (name?: string) => {
  const key = (name || "?").charCodeAt(0) || 0;
  return AVATAR_TINTS[key % AVATAR_TINTS.length];
};

// Prepare params for API/data filtering
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" },
  userType?: string,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    isMyNetwork: true,
  };

  // Add userInfo.type filter based on URL parameter. "all" is the combined
  // book — B2B and B2C together — so it carries no type filter at all.
  if (userType && userType !== "all") {
    // Map URL parameter to actual user type values
    let mappedUserType = userType;
    if (userType === "b2b") {
      mappedUserType = "franchise";
    } else if (userType === "b2c") {
      mappedUserType = "customer";
    }
    params.filter["userInfo.type"] = mappedUserType;
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

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.orderDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.type && filter.type !== "All") {
    params.filter.type = filter.type;
  }

  // Wallet status filter
  if (filter.status && filter.status !== "All") {
    if (filter.status === "DueToday") {
      const today = new Date();
      params.filter.validityEndDate = {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      };
    } else if (filter.status === "DueTomorrow") {
      const tomorrow = addDays(new Date(), 1);
      params.filter.validityEndDate = {
        $gte: startOfDay(tomorrow),
        $lte: endOfDay(tomorrow),
      };
    } else if (filter.status === "Overdue") {
      // Validity has already lapsed and money is still on the wallet.
      params.filter.validityEndDate = { $lt: startOfDay(new Date()) };
      params.filter.totalPayableAmount = { $gt: 0 };
    } else if (filter.status === "DueSoon") {
      // Falls due inside the next week — the nudge window.
      const today = new Date();
      params.filter.validityEndDate = {
        $gte: startOfDay(today),
        $lte: endOfDay(addDays(today, DUE_SOON_DAYS)),
      };
      params.filter.totalPayableAmount = { $gt: 0 };
    } else if (filter.status === "Available") {
      // Live wallets with headroom left to spend.
      params.filter.status = "Approved";
      params.filter.creditAvailable = { $gt: 0 };
    } else {
      const statusOption = PaylaterService.getWalletStatusOptions().find(
        (option) => option.value === filter.status,
      );
      if (statusOption && statusOption.statuses) {
        params.filter.status = { $in: statusOption.statuses };
      }
    }
  }

  // KYC status filter
  if (filter.kycStatus && filter.kycStatus !== "All") {
    params.filter.kycStatus = filter.kycStatus;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

// Returns a promise that resolves to an array of sample order data, filtered and paginated
export const getData = async (params: Record<string, any>) => {
  const response = await PaylaterService.getRequests(params);
  const d = Array.isArray(response?.data?.data) ? response?.data?.data : [];
  return PaylaterService.formatPaylaterRequest(d).map((item: any) => {
    return {
      ...item,
      viewBtnLink:
        item.status === "Pending"
          ? `/dashboard/paylater/view/${item._id}`
          : item.userRedirectionLink,
    };
  });
};

export async function getCount(params: Record<string, any>) {
  const { page, count, ...restParams } = params;
  const resp = await PaylaterService.getRequests({
    ...restParams,
    outputType: "count",
  });
  return resp.data?.data?.count || 0;
}
