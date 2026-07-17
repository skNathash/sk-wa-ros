import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import type { PaginationState } from "~/types/CommonTypes";

// Fetch audit log list for a given routeId. Backend currently returns whole
// audit list; pagination is applied client-side by the caller.
export const getData = async (routeId: string, params?: any) => {
  if (!routeId) return [];
  const resp: any = await DeliveryRoutesService.getAuditTrail(routeId);
  // try multiple shapes
  const list = resp?.data?.data ?? resp?.data ?? [];
  return Array.isArray(list) ? list : [];
};

// Return total count of audit logs for the route
export const getCount = async (routeId: string, params?: any) => {
  const data = await getData(routeId, params);
  return (data || []).length;
};

export const prepareParams = (
  params: Record<string, any> | undefined,
  paginationRef?: { current: PaginationState },
) => {
  const p: Record<string, any> = {};
  if (paginationRef?.current) {
    p.page = paginationRef.current.activePage || 1;
    p.count = paginationRef.current.rowsPerPage || 10;
  }
  if (params) {
    Object.assign(p, params);
  }
  return p;
};

export default { getData, getCount, prepareParams };
