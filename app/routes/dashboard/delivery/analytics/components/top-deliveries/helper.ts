import { startOfDay, endOfDay } from "date-fns";
import type { PaginationState } from "~/types/CommonTypes";

// Prepare params for API/data filtering
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.deliveryDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.status && filter.status !== "All") {
    params.filter.status = filter.status;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

// Returns a promise that resolves to an array of sample delivery data, filtered and paginated
export function getData(params: Record<string, any>): Promise<any[]> {
  // Sample data for top deliveries
  const allData = [
    {
      _id: "1",
      name: "John Smith",
      completedDeliveries: 45,
      totalDeliveries: 50,
      successRate: 90,
      averageDeliveryTime: "2.5 hours",
      lastDelivery: "2025-01-15",
      status: "Active",
      rating: 4.8,
    },
    {
      _id: "2",
      name: "Sarah Johnson",
      completedDeliveries: 38,
      totalDeliveries: 42,
      successRate: 90.5,
      averageDeliveryTime: "2.8 hours",
      lastDelivery: "2025-01-14",
      status: "Active",
      rating: 4.6,
    },
    {
      _id: "3",
      name: "Mike Davis",
      completedDeliveries: 32,
      totalDeliveries: 35,
      successRate: 91.4,
      averageDeliveryTime: "2.2 hours",
      lastDelivery: "2025-01-13",
      status: "Active",
      rating: 4.9,
    },
    {
      _id: "4",
      name: "Emily Wilson",
      completedDeliveries: 28,
      totalDeliveries: 30,
      successRate: 93.3,
      averageDeliveryTime: "2.1 hours",
      lastDelivery: "2025-01-12",
      status: "Active",
      rating: 4.7,
    },
    {
      _id: "5",
      name: "David Brown",
      completedDeliveries: 25,
      totalDeliveries: 28,
      successRate: 89.3,
      averageDeliveryTime: "3.0 hours",
      lastDelivery: "2025-01-11",
      status: "Active",
      rating: 4.5,
    },
  ];

  let filtered = allData;
  // Filter by name (search)
  if (params?.filter?.name?.$regex) {
    const regex = new RegExp(
      params.filter.name.$regex,
      params.filter.name.$options
    );
    filtered = filtered.filter((item) => regex.test(item.name));
  }
  // Filter by status
  if (params?.filter?.status) {
    filtered = filtered.filter((item) => item.status === params.filter.status);
  }
  // Filter by delivery date
  if (params?.filter?.deliveryDate) {
    const gte = params.filter.deliveryDate.$gte;
    const lte = params.filter.deliveryDate.$lte;
    filtered = filtered.filter((item) => {
      const d = new Date(item.lastDelivery);
      return d >= gte && d <= lte;
    });
  }

  // Pagination
  const page = params.page || 1;
  const count = params.count || 10;
  const start = (page - 1) * count;
  const end = start + count;
  return Promise.resolve(filtered.slice(start, end));
}

// Returns a promise that resolves to the count of filtered delivery data
export function getCount(params: Record<string, any>): Promise<number> {
  // Use same filtering as getData, but return count
  return getData({ ...params, page: 1, count: 10000 }).then(
    (data) => data.length
  );
}
