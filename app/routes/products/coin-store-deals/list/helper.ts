import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export async function getData(params: Record<string, any>) {
  const r = await SellerCatalogService.getKcStoreDeals(params);
  return Array.isArray(r.data?.data) ? r.data.data : [];
}

export async function getCount(params: Record<string, any>) {
  const r = await SellerCatalogService.getKcStoreDeals({
    ...params,
    outputType: "count",
  });
  return r.data?.data?.count || 0;
}

export function prepareParams(
  filter: Record<string, any>,
  pagination: PaginationState,
) {
  let p = {
    page: pagination.activePage,
    limit: pagination.endSlNo,
  };

  return p;
}
