import FranchiseService from "~/services/FranchiseService";
import { startOfDay, endOfDay } from "date-fns";
import CommonService from "~/services/CommonService";
import type { PaginationState } from "~/types/CommonTypes";
import AuthService from "~/services/AuthService";

export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.getFranchiseNetwork(params);
  const list = response?.data?.data || [];
  // Compute initials and address for each item so views (mobile/desktop)
  // can reuse the same prepared keys instead of recomputing.
  return (list || []).map((item: Record<string, any>) => {
    // Prefer business name for initials, fallback to owner name
    const displayName = (item?.name || item?.ownerDetails?.name || "")
      .toString()
      .trim();
    const parts = displayName.split(/\s+/).filter(Boolean);
    const initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");

    // Compact location: prefer city/town + state when available
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

    // Full address composed from available address fields
    const addressParts = [
      item?.city,
      item?.town,
      item?.district,
      item?.state,
    ].filter(Boolean);
    const address = addressParts.length ? addressParts.join(", ") : "";

    return {
      ...item,
      initials: initials.toUpperCase(),
      // human-friendly short location (used in mobile/compact layouts)
      location,
      // full assembled address (used in desktop/full layouts)
      address,
    };
  });
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };

  delete p.page;
  delete p.limit;
  delete p.sort;
  delete p.includeRoutes;

  const response = await FranchiseService.getFranchiseNetworkCount(p);
  // API now returns an object with multiple keys (approved, total, pending, rejected, registeredThisWeek)
  // Return the full data object so callers can read required fields without multiple API calls
  return response?.data?.data || {};
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort?: { key: string; value: "asc" | "desc" },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    // includeRoutes: true,
    sort: sort ? { [sort.key]: sort.value === "asc" ? 1 : -1 } : { name: 1 },
    filter: {},
  };

  // search
  if (filter.search && String(filter.search).trim()) {
    params.search = String(filter.search).trim();
  }

  // alpha (starts-with) filter
  if (filter.alpha) {
    params.search = `^${filter.alpha}`;
  }

  if (filter.primaryBusiness && filter.primaryBusiness !== "choose") {
    params.filter.primaryBusinessId = filter.primaryBusiness;
  }

  if (filter.customerFilter && filter.customerFilter !== "all") {
    params.customerFilter = filter.customerFilter;
  }

  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  // If logged in user is NOT an SK seller, only fetch records created by current user
  try {
    if (!AuthService.isSkSeller()) {
      params.createdByMe = true;
    }
  } catch (e) {
    // noop - if auth check fails, avoid breaking the params
  }

  return params;
};
