import { endOfDay, startOfDay } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    groupbycond: "toPartyId",
    filter: {
      status: "pending",
    },
    sort: {
      "_id.name": 1,
    },
  };

  if (filter.fromDate && filter.toDate) {
    params.filter.transactionDate = {
      $gte: startOfDay(new Date(filter.fromDate)),
      $lte: endOfDay(new Date(filter.toDate)),
    };
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await AccountService.getTransactions(params);
  return (response?.data?.data || []).map((item: any) => {
    return {
      ...item,
      _id: {
        ...item._id,
        type: AccountService.getPartyTypeLabel(item._id?.type),
        redirectionUrl: AccountService.preparePartyTypeRedirectionUrl(
          item._id?.type,
          item._id?.id || item._id?._id
        ),
      },
    };
  });
};

export const getCount = async (params: Record<string, any>) => {
  const response = await AccountService.getTransactions(params);
  return response?.data?.data?.[0]?.total || 0;
};
