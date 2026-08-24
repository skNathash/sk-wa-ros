import AuthService from "~/services/AuthService";
import VendorService from "~/services/VendorService";
import type { PaginationState } from "~/types/CommonTypes";

// Types for filter and pagination
interface Filter {
  search?: string;
  dateRange?: [Date, Date];
  activeTab?: string;
  status?: string;
  feature?: string;
  alpha?: string;
  createdBy?: string;
  distance?: string | number;
  brand?: any[];
  quickFilter?: string;
}

// Quick-filter chips that map to a purchase-activity window. The API supports
// e.g. filter={"purchaseAnalytics.last15Days.orders":{"$gt":0}} — i.e. vendors
// with at least one purchase order in that window.
const ACTIVITY_QUICK_FILTERS: Record<string, string> = {
  "15-day": "purchaseAnalytics.last15Days.orders",
  "30-day": "purchaseAnalytics.last30Days.orders",
};

export const mapSelectedData = (
  data: Record<string, any>[],
  selected: Record<string, any>
) => {
  return data.map((item) => ({
    ...item,
    selected: selected[item._id]?.selected || false,
  }));
};

// Prepare filter parameters for API calls
export const prepareParams = (filter: Filter, pagination: PaginationState) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { name: 1 },
    filter: {
      // "franchise.id": AuthService.getLoggedInUserId(),
      // vendorType: "Wholesaler",
    },
  };

  // Add search filter
  if (filter.search?.trim()) {
    const searchTerm = filter.search.trim();
    params.search = searchTerm;
  }

  // Note: search is passed as a root-level param (`params.search`) and
  // we do not add $or filters inside `filter` here. Backend will handle
  // root-level search appropriately.

  // Add distance (in km) as a root-level param when present
  if (
    filter.distance !== undefined &&
    filter.distance !== null &&
    filter.distance !== ""
  ) {
    const d = Number(filter.distance);
    if (!isNaN(d)) {
      params.distance = d;
    }
  }

  // Handle status filter
  if (filter.status && filter.status !== "All") {
    if (filter.status === "pendingPayment") {
      params.filterByPendingPayments = true;
    } else if (filter.status === "pending") {
      params.filterByPendingDeliveries = true;
    } else {
      params.filter.status = filter.status;
    }
  }

  if (filter.alpha) {
    params.filter.name = "^" + filter.alpha;
  }

  if (filter.createdBy === "me") {
    params.filter["franchise.id"] = AuthService.getLoggedInUserId();
  }

  // Map OTP selections from createdBy dropdown
  if (filter.createdBy === "Otp Verified") {
    params.filter.isOtpVerified = true;
  } else if (filter.createdBy === "OTP not verified") {
    params.filter.isOtpVerified = false;
  }

  // Handle brand filter
  if (filter.brand && filter.brand.length > 0) {
    params.filter.brandId = filter.brand[0]?.value?.id;
  }

  // Quick-filter chip (due / alerts / cod / 30-day / 15-day).
  // The activity chips map to `purchaseAnalytics` counters inside `filter`
  // (vendors we bought from at least once in that window); the rest are still
  // passed as a root-level key for the backend to interpret.
  if (filter.quickFilter && filter.quickFilter !== "all") {
    const activityField = ACTIVITY_QUICK_FILTERS[filter.quickFilter];
    if (activityField) {
      params.filter[activityField] = { $gt: 0 };
    } else {
      params.quickFilter = filter.quickFilter;
    }
  }

  return params;
};

// Map the backend `orderStatistics` block on a vendor row to the flat
// `summary` shape the list/detail views read (totalPOValue, pendingDeliveries,
// unpaidInvoices, unpaidValue). Mirrors the old per-vendor getSummary mapping.
export const mapOrderStatistics = (stats: Record<string, any> = {}) => {
  const pending = stats.paymentBreakdown?.Pending || {};
  return {
    totalPOValue: stats.totalPOValue || 0,
    pendingDeliveries: stats.statusBreakdown?.Approved?.count || 0,
    unpaidInvoices: pending.count || 0,
    unpaidValue: pending.totalValue || 0,
  };
};

// Get vendor list data from API (stats aggregated by the backend)
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await VendorService.getVendorsWithStats(params);
    if (response.statusCode === 200 && Array.isArray(response.data?.data)) {
      return response.data.data.map((item: any) => {
        const formatted = VendorService.formatVendorData(item);
        return {
          ...formatted,
          summary: mapOrderStatistics(item.orderStatistics),
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
};

// Get vendor count from API
export const getCount = async (params: Record<string, any>) => {
  try {
    const countParams: Record<string, any> = { ...params, outputType: "count" };

    delete countParams.page;
    delete countParams.count;
    delete countParams.sort;

    const response = await VendorService.getVendorsWithStats(countParams);
    if (response.statusCode === 200) {
      return response.data?.count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching vendors count:", error);
    return 0;
  }
};

export const prepareSummaryParams = (filter: Record<string, any>) => {
  let params: Record<string, any> = {
    filter: {},
  };
  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { "vendorInfo.name": { $regex: search, $options: "i" } },
      { "vendorInfo.email": { $regex: search, $options: "i" } },
      { "vendorInfo.mobile": { $regex: search, $options: "i" } },
    ];
  }

  if (filter.id) {
    params.filter["vendorInfo.id"] = filter.id;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getSummary = async (params: Record<string, any>) => {
  let summary = {
    totalVendors: 0,
    totalPOValue: 0,
    pendingDeliveries: 0,
    unpaidInvoices: 0,
  };
  try {
    const response = await VendorService.getVendorStatistics(params);
    if (response.statusCode === 200) {
      const pending = response.data?.data?.paymentBreakdown?.Pending || {};
      return {
        ...summary,
        totalPOValue: response.data?.data?.totalPOValue,
        pendingDeliveries:
          response.data?.data?.statusBreakdown?.Approved?.count || 0,
        unpaidInvoices: pending.count || 0,
        unpaidValue: pending.value || 0,
      };
    }
    return summary;
  } catch (error) {
    return {
      ...summary,
    };
  }
};
