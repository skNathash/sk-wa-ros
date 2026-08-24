import FranchiseService from "~/services/FranchiseService";
import NetworkAnalyticsService from "~/services/NetworkAnalyticsService";

// Fetch the franchise details by id via the list API (filter: { _id }).
// franchise/list returns the array at data.data; take the first match.
export const getFranchise = async (id: string) => {
  const response = await FranchiseService.getFranchises({
    filter: { _id: id },
  });
  const franchise = response?.data?.data?.[0] || null;
  return franchise ? FranchiseService.formatFranchise(franchise) : null;
};

// Fetch the analytics detail (plan, sales, orders, customers) for a single
// retailer. Reuses the network dashboard's retailer-detail-view API, scoped to
// one franchise via filter.franchiseId (the business refId, e.g. "F325618").
// The endpoint returns a paginated array at data.data; a single-franchise
// filter yields one row, so take the first match.
export const getRetailerDetail = async (
  franchiseId: string,
  signal?: AbortSignal,
) => {
  const response = await NetworkAnalyticsService.getRetailerDetailView(
    { filter: { franchiseId } },
    signal,
  );
  return response?.data?.data?.[0] || null;
};
