import AuthService from "~/services/AuthService";
import LogisticsService from "~/services/LogisticsService";
import type { PaginationState } from "~/types/CommonTypes";

// Prepare params for the handoff API. Endpoint: GET sales/shipment/fetch
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  status: string = "Pending"
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      franchiseId: AuthService.getLoggedInUserId() || "",
      status,
    },
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.mobile": { $regex: search, $options: "i" } },
    ];
  }

  return params;
};

export async function getData(params: Record<string, any>) {
  const response = await LogisticsService.fetchShipments(params);
  // TODO: response structure is unknown — inspect the raw payload once.
  console.log("handsoff fetch response", response);
  const data = response?.data?.data;
  return Array.isArray(data) ? data : data?.list || data?.items || [];
}

export async function getCount(params: Record<string, any>) {
  const p: Record<string, any> = { ...params, outputType: "count" };
  delete p.page;
  delete p.limit;
  const response = await LogisticsService.fetchShipments(p);
  console.log("handsoff count response", response);
  const data = response?.data?.data;
  if (typeof data === "number") return data;
  if (data && typeof data.count === "number") return data.count;
  return data?.total || 0;
}

/**
 * Fetch the counts shown on the hand-off segment tabs: how many shipments are
 * waiting to be handed off (Pending) and how many were verified today
 * (Delivered). Returns the two counts together so the tabs render in one pass.
 */
export async function getHandoffCounts(): Promise<{
  waiting: number;
  verifiedToday: number;
}> {
  const franchiseId = AuthService.getLoggedInUserId() || "";
  const base = { franchiseId };

  const [waiting, verifiedToday] = await Promise.all([
    getCount({ filter: { ...base, status: "Pending" } }),
    getCount({ filter: { ...base, status: "Delivered" } }),
  ]);

  return { waiting, verifiedToday };
}
