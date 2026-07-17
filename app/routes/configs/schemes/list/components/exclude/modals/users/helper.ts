import FranchiseService from "~/services/FranchiseService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.getFranchiseNetwork(params);
  const list = response?.data?.data || [];
  
  return (list || []).map((item: Record<string, any>) => {
    const displayName = (item?.name || item?.ownerDetails?.name || "")
      .toString()
      .trim();

    const cityOrTown = item?.city || item?.town || "";
    const state = item?.state || "";
    let location = "";
    if (cityOrTown && state) {
      location = `${cityOrTown}, ${state}`;
    } else if (cityOrTown) {
      location = cityOrTown;
    } else if (state) {
      location = state;
    }

    const addressParts = [
      item?.city,
      item?.town,
      item?.district,
      item?.state,
    ].filter(Boolean);
    const address = addressParts.length ? addressParts.join(", ") : "";

    return {
      ...item,
      location,
      address,
    };
  });
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };

  delete p.page;
  delete p.limit;
  delete p.sort;

  const response = await FranchiseService.getFranchiseNetworkCount(p);
  return response?.data?.data?.total || 0;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
  };

  if (filter.search && String(filter.search).trim()) {
    params.search = String(filter.search).trim();
  }

  if (filter.alpha) {
    params.search = `^${filter.alpha}`;
  }

  return params;
};
