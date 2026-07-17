import type { PaginationState } from "~/types/CommonTypes";
import SellerService from "~/services/SellerService";

export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {
      status: "SettlementInitiated",
    },
  };

  if (filter.userId) {
    params.filter.shipmentUserId = filter.userId;
  }

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderRefId: { $regex: search, $options: "i" } },
      { settlementId: { $regex: search, $options: "i" } },
    ];
  }

  return params;
};

export async function getData(params: Record<string, any>) {
  const response = await SellerService.getSettlements(params);
  return SellerService.formatSettlementsResponse(response?.data?.data || []);
}

export async function getCount(params: Record<string, any>) {
  const p: Record<string, any> = { ...params, outputType: "count" };
  delete p.page;
  delete p.limit;

  const response = await SellerService.getSettlements(p);
  return response?.data?.data || { count: 0, value: 0 };
}
