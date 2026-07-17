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
}

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

  return params;
};

// Get purchase orders data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await VendorService.getDashboardVendorList(params);
    if (response.statusCode === 200 && Array.isArray(response.data?.data)) {
      const formattedData = response.data.data.map((item: any) => {
        return VendorService.formatVendorData(item);
      });

      const promises = formattedData.map(async (item: any) => {
        try {
          const response = await getSummary({
            filter: {
              "vendorInfo.id": item._id,
            },
          });
          return { id: item._id, summary: response };
        } catch (error) {
          return { id: item._id, summary: {} };
        }
      });

      const summaryData = await Promise.all(promises);

      const data = formattedData.map((item: any) => {
        const summary = summaryData.find((s: any) => s.id === item._id);
        return { ...item, summary: summary?.summary || {} };
      });

      return data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
};

// Get purchase orders count from API
export const getCount = async (params: Record<string, any>) => {
  try {
    const countParams: Record<string, any> = { ...params, outputType: "count" };

    delete countParams.page;
    delete countParams.count;
    delete countParams.sort;

    const response = await VendorService.getDashboardVendorList(countParams);
    if (response.statusCode === 200) {
      return response.data?.count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching purchase orders count:", error);
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
