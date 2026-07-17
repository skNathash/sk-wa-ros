import { endOfDay, startOfDay } from "date-fns";
import PosService from "~/services/PosService";
import type { PaginationState } from "~/types/CommonTypes";

// Prepare params for RSP config history fetch
export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort?: { key: string; value: "asc" | "desc" },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      // "franchiseInfo.id": AuthService.getLoggedInUserId(),
      dealId: filters.productId,
    },
    sort: sort
      ? {
          [sort.key]: sort.value === "asc" ? 1 : -1,
        }
      : undefined,
  };

  // Handle search filter
  if (filters.search?.trim()) {
    const regEx = {
      $regex: filters.search,
      $options: "g",
    };
    params.filter.$or = [
      { "oldData.price": regEx },
      { "newData.price": regEx },
      { changeType: regEx },
    ];
  }

  // Handle type filter
  if (filters.type && filters.type !== "") {
    if (filters.type === "B2B") {
      params.filter.applicableFor = "Network";
    } else if (filters.type === "B2C") {
      params.filter.applicableFor = "Customer";
    }
  }

  // Handle price mode filter (only 'fixed' supported)
  if (filters.isFixedPrice) {
    // Filter based on the new configuration being fixed price
    params.filter["newData.isFixedPrice"] = true;
  }

  if (filters.dateRange && filters.dateRange.length === 2) {
    params.filter.createdAt = {
      $gte: startOfDay(filters.dateRange[0]),
      $lte: endOfDay(filters.dateRange[1]),
    };
  }

  return params;
};

// Fetch RSP config history data
export const getData = async (params: Record<string, any>) => {
  const response = await PosService.getSellerPriceConfigLogs(params);
  const rawData = response.data?.data || [];
  return PosService.formatPriceConfigLogData(rawData);
};

// Fetch count for pagination
export const getCount = async (params: Record<string, any>) => {
  const p: Record<string, any> = { ...params, outputType: "count" };

  delete p.page;
  delete p.count;
  delete p.sort;

  const response = await PosService.getSellerPriceConfigLogs(p);
  return response.data?.data?.totalCount || 0;
};

// Calculate price change statistics
export const calculatePriceChangeStats = (data: any[]) => {
  if (!data.length) {
    return {
      totalChanges: 0,
      averageChange: 0,
      averagePercentChange: 0,
      positiveChanges: 0,
      negativeChanges: 0,
    };
  }

  let totalChange = 0;
  let totalPercentChange = 0;
  let positiveChanges = 0;
  let negativeChanges = 0;

  data.forEach((item) => {
    const prevPrice = Number(item.oldData?.price || 0);
    const newPrice = Number(item.newData?.price || 0);
    const change = newPrice - prevPrice;

    totalChange += change;

    if (prevPrice !== 0) {
      const percentChange = (change / prevPrice) * 100;
      totalPercentChange += percentChange;
    }

    if (change > 0) {
      positiveChanges++;
    } else if (change < 0) {
      negativeChanges++;
    }
  });

  return {
    totalChanges: data.length,
    averageChange: totalChange / data.length,
    averagePercentChange: totalPercentChange / data.length,
    positiveChanges,
    negativeChanges,
  };
};
