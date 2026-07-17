import PosService from "~/services/PosService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  const response = await PosService.getPosOrders(params);
  return (response?.data || []).map(PosService.formatPosOrderResp);
};

export const getCount = async (params: Record<string, any>) => {
  const response = await PosService.getPosOrdersCount(params);
  return response?.data || 0;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
  };
  return params;
};
