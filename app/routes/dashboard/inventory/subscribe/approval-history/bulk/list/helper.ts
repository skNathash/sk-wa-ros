import { endOfDay, startOfDay } from "date-fns";
import InventorySubscribeService from "~/services/InventorySubscribeService";

// Prepare filter parameters for API calls
export const prepareParams = (filter: any, pagination: any, sort: any) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    filter: {
      isUploaded: true,
    },
    groupbycond: "batchId",
  };

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.$or = [
      { fileName: { $regex: filter.search.trim(), $options: "i" } },
      { batchId: { $regex: filter.search.trim(), $options: "i" } },
    ];
  }

  // Add date range filter
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.filter["createdAt"] = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  if (filter.status && filter.status !== "All") {
    params.finalStatus = filter.status;
  }

  return params;
};

// Get bulk upload data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getSellerImportProducts(
      params
    );
    if (response.statusCode === 200 && response.data?.data) {
      // Map status to _statusColor
      return (response.data.data || []).map((item: any) => {
        let color = "light";
        switch ((item.finalStatus || "").toLowerCase()) {
          case "approved":
            color = "success";
            break;
          case "pending":
            color = "warning";
            break;
          case "rejected":
            color = "danger";
            break;
        }
        return { ...item, _statusColor: color };
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching bulk upload data:", error);
    return [];
  }
};

// Get bulk upload count from API
export const getCount = async (params: Record<string, any>) => {
  try {
    const p: Record<string, any> = {
      ...params,
      outputType: "count",
    };

    delete p.page;
    delete p.count;
    delete p.sort;

    const response = await InventorySubscribeService.getSellerImportProducts(p);

    if (response.statusCode === 200 && response.data?.data?.totalCount) {
      return response.data.data.totalCount || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching bulk upload count:", error);
    return 0;
  }
};
