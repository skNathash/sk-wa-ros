import { endOfDay, startOfDay, sub } from "date-fns";
import NetworkAnalyticsService from "~/services/NetworkAnalyticsService";

// Prepare filter parameters for API calls
export const prepareParams = (filter: any, pagination: any, sort: any) => {
  const params: any = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  if (sort?.key && sort?.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  // Determine franchise id if provided either as explicit id or via selected franchise object
  const franchiseId = filter?.franchiseId || undefined;

  // Date range is not mandatory. When no range is selected, default to the
  // last 30 years so all data is returned.
  const now = new Date();
  if (franchiseId) {
    params.filter.franchiseId = franchiseId;
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  } else {
    params.filter.createdAt = {
      $gte: startOfDay(sub(now, { years: 30 })).toISOString(),
      $lte: endOfDay(now).toISOString(),
    };
  }

  // Add state filter
  if (filter.state && filter.state !== "All") {
    params.filter.state = filter.state;
  }

  // Add district filter
  if (filter.district && filter.district !== "All") {
    params.filter.district = filter.district;
  }

  // Add town filter
  if (filter.town && filter.town !== "All") {
    params.filter.town = filter.town;
  }

  // Add pincode filter
  if (filter.pincode?.trim()) {
    params.filter.pincode = filter.pincode.trim();
  }

  // Add network type filter
  if (filter.networkType && filter.networkType !== "all") {
    if (filter.networkType === "SKRETAILER") {
      params.filter.networkType = {
        $in: ["SKRETAILER", "SFSELLER", "SFBUYER"],
      };
    } else {
      params.filter.networkType = filter.networkType;
    }
  }

  if (filter.planPurchased === "yes") {
    params.filter.hasSubscriptionPlan = true;
  } else if (filter.planPurchased === "no") {
    params.filter.hasSubscriptionPlan = false;
  }

  return params;
};

// Get retailers data from API
export const getData = async (
  params: Record<string, any>,
  signal?: AbortSignal,
) => {
  try {
    const response =
      await NetworkAnalyticsService.getRetailerDetailView(params, signal);
    const d = Array.isArray(response?.data?.data) ? response?.data?.data : [];
    return {
      data: d,
      count: response?.data?.pagination?.totalItems || 0,
    };
  } catch (error) {
    console.error("Error fetching retailers:", error);
    return { data: [], count: 0 };
  }
};
