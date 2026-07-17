import { endOfDay } from "date-fns";
import PaylaterService from "~/services/PaylaterService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  return {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      totalPayableAmount: {
        $gt: 0,
      },
      validityEndDate: {
        $lte: endOfDay(new Date()),
      },
    },
    isMyNetwork: true,
  };
};

export const getData = async (params: Record<string, any>) => {
  const response = await PaylaterService.getRequests(params);
  const d = Array.isArray(response?.data?.data) ? response?.data?.data : [];
  return PaylaterService.formatPaylaterRequest(d);
};

export async function getCount(params: Record<string, any>) {
  const { page, count, ...restParams } = params;
  const resp = await PaylaterService.getRequests({
    ...restParams,
    outputType: "count",
  });
  return resp.data?.data?.count || 0;
}
