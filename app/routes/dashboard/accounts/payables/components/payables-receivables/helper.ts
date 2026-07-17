import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";

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
    return {
      _id: e._id,
      name: user.name,
      type: user.type,
      outstandingAmount: e.outstandingAmount,
      date: e.date || e.createdAt,
      partyLabel: AccountService.getPartyTypeLabel(user.type),
      redirectionUrl: AccountService.preparePartyTypeRedirectionUrl(
        user.type,
        user.id,
      ),
    };
  });
};

export const getTotalAmount = async (type: "payables" | "receivables") => {
  const response = await AccountService.getPayablesReceiveables({
    type,
    outputType: "count",
  });
  return response?.data?.data?.totalOutstandingAmount || 0;
};

export const getCount = async (params: Record<string, any>) => {
  const response = await AccountService.getPayablesReceiveables({
    ...params,
    outputType: "count",
  });
  return response?.data?.data?.totalParties || 0;
};
