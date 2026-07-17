import { startOfDay, endOfDay } from "date-fns";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import VendorService from "~/services/VendorService";

// Prepare filter parameters for API calls
export const prepareParams = (
  filter: any,
  pagination: any,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    filter: {},
  };

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.$or = [
      { poId: { $regex: filter.search.trim(), $options: "i" } },
    ];
  }

  // Add date range filter
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.filter["paymentDate"] = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  // if (filter.vendorId) {
  //   params.filter["vendorDetails.id"] = filter.vendorId;
  // }

  if (filter.status && filter.status !== "All") {
    params.filter.status = filter.status;
  }

  return params;
};

// Get purchase orders data from API
export const getData = async (
  vendorId: string,
  params: Record<string, any>
) => {
  try {
    const response = await VendorService.getVendorPayments(vendorId, params);
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
};

// Get purchase orders count from API
export const getCount = async (
  vendorId: string,
  params: Record<string, any>
) => {
  try {
    const response = await VendorService.getVendorPayments(vendorId, {
      ...params,
      outputType: "count",
    });
    if (response.statusCode === 200) {
      return {
        count: response.data?.[0]?.count || 0,
        value: response.data?.[0]?.totalValue || 0,
      };
    }
    return { count: 0, value: 0 };
  } catch (error) {
    console.error("Error fetching purchase orders count:", error);
    return { count: 0, value: 0 };
  }
};
