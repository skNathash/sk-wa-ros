import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";

// Soft, distinct tints per party type so a Customer, Vendor and Retailer read as
// different kinds of relationship at a glance in the list.
const PARTY_TYPE_BADGE_TINTS: Record<string, string> = {
  customer: "tw:bg-sky-50 tw:text-sky-700 tw:border-sky-200",
  vendor: "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-200",
  franchise: "tw:bg-violet-50 tw:text-violet-700 tw:border-violet-200",
};

export const getPartyTypeBadgeClass = (type?: string) =>
  PARTY_TYPE_BADGE_TINTS[(type || "").toLowerCase().trim()] ||
  "tw:bg-gray-50 tw:text-gray-600 tw:border-gray-200";

// Human age of the outstanding entry ("Today", "1d old", "14d old"), echoing the
// "14d old" recency cue in the shared design. Returns null when date is missing.
export const getAgeLabel = (date?: string | number | Date) => {
  if (!date) return null;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  return `${days}d old`;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    type: filter.type,
  };

  if (filter.search?.trim()) {
    params.search = filter.search.trim();
  }
  if (filter["partyDetails.type"] && filter["partyDetails.type"] !== "all") {
    params.filter = { "partyDetails.type": filter["partyDetails.type"] };
  }
  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await AccountService.getPayablesReceiveables(params);
  return (response?.data?.data || []).map((e: any) => {
    const user = e.counterParty || {};
    // Resolve the date the outstanding entry is aged from once here, so both the
    // desktop and mobile views consume a ready-made age label instead of each
    // recomputing it.
    const ageDate = e.lastTransactionDate;
    return {
      _id: e._id,
      partyId: user.id,
      name: user.name,
      type: user.type,
      mobile: user.mobile || user.phone,
      outstandingAmount: e.outstandingAmount,
      lastTransactionDate: e.lastTransactionDate,
      ageDate,
      ageLabel: getAgeLabel(ageDate),
      partyLabel: AccountService.getPartyTypeLabel(user.type),
      redirectionUrl: AccountService.preparePartyTypeRedirectionUrl(
        user.type,
        user.id,
      ),
    };
  });
};

export const getSummary = async (
  type: "payables" | "receivables",
  partyType?: string,
) => {
  const params: Record<string, any> = {
    type,
    outputType: "count",
  };
  if (partyType && partyType !== "all") {
    params.filter = { "partyDetails.type": partyType };
  }
  const response = await AccountService.getPayablesReceiveables(params);
  const data = response?.data?.data || {};
  return {
    amount: data.totalOutstandingAmount || 0,
    parties: data.totalParties || 0,
  };
};

export const getCount = async (params: Record<string, any>) => {
  const response = await AccountService.getPayablesReceiveables({
    ...params,
    outputType: "count",
  });
  return response?.data?.data?.totalParties || 0;
};
