import type { PaginationState } from "~/types/CommonTypes";
import AuthService from "~/services/AuthService";
import { RackBinService } from "~/services/RackBinService";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    sort: { barcode: 1 },
    filter: {
      barcode: { $exists: true, $ne: "" },
      isUsable: true,
      quantity: { $gt: 0 },
    },
  };

  if (filter.alpha) {
    params.filter.name = { $regex: `^${filter.alpha}`, $options: "i" };
  }

  const search = filter.search?.trim();
  if (search) {
    params.filter = {
      ...params.filter,
      $or: [
        { barcode: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ],
    };
  }

  return params;
};

export async function getData(params: Record<string, any>): Promise<any[]> {
  const fid = AuthService.getLoggedInUserId();
  const response = await RackBinService.getMasterData(fid, params);
  return response?.data?.data || [];
}

export async function getCount(params: Record<string, any>): Promise<number> {
  const p: Record<string, any> = { ...(params || {}) };
  delete p.page;
  delete p.limit;
  p.outputType = "count";

  const fid = AuthService.getLoggedInUserId();
  const response = await RackBinService.getMasterData(fid, p);
  return response?.data?.count || response?.data?.data?.length || 0;
}
