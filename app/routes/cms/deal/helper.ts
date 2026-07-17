import { startOfDay, endOfDay } from "date-fns";
import type { PaginationState } from "~/types/CommonTypes";

export const summaryData = [
  {
    label: "Total Deals",
    value: 3,
    icon: "activity",
    color: "primary",
  },
  {
    label: "Active Deals",
    value: 2,
    icon: "percent",
    color: "success",
  },
  {
    label: "Orders",
    value: 380,
    icon: "shopping-bag",
    color: "info",
  },
  {
    label: "Revenue",
    value: 1500000,
    icon: "indian-rupee",
    color: "warning",
  },
];

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
    params.filter.remarks = {
      $regex: search,
      $options: "i",
    };
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.orderDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.type && filter.type !== "All") {
    params.filter.type = filter.type;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

// Returns a promise that resolves to an array of sample deal data, filtered and paginated
export function getData(params: Record<string, any>): Promise<any[]> {
  // Sample data for deals
  const allData = [
    {
      id: "1",
      name: "Deal 1",
      active: true,
      type: "Flash",
      sales10d: 12000,
      sales20d: 22000,
      sales30d: 35000,
      totalProducts: 15,
      totalItems: 120,
      revenue: 500000,
      unitsSold: 320,
      b2cPrice: 499,
      b2bPrice: 450,
      seller: "Seller A",
      startDate: "2025-06-01",
      endDate: "2025-12-01",
      status: "Active",
      discount: 10,
    },
    {
      id: "2",
      name: "Deal 2",
      active: false,
      type: "Clearance",
      sales10d: 8000,
      sales20d: 15000,
      sales30d: 21000,
      totalProducts: 8,
      totalItems: 60,
      revenue: 200000,
      unitsSold: 110,
      b2cPrice: 299,
      b2bPrice: 250,
      seller: "Seller B",
      startDate: "2025-05-15",
      endDate: "2025-10-15",
      status: "Inactive",
      discount: 5,
    },
    {
      id: "3",
      name: "Deal 3",
      active: true,
      type: "Festival",
      sales10d: 15000,
      sales20d: 27000,
      sales30d: 40000,
      totalProducts: 20,
      totalItems: 200,
      revenue: 800000,
      unitsSold: 500,
      b2cPrice: 599,
      b2bPrice: 520,
      seller: "Seller C",
      startDate: "2025-04-20",
      endDate: "2025-09-20",
      status: "Active",
      discount: 15,
    },
  ];

  let filtered = allData;
  // Filter by name (search)
  if (params?.filter?.remarks?.$regex) {
    const regex = new RegExp(
      params.filter.remarks.$regex,
      params.filter.remarks.$options
    );
    filtered = filtered.filter((item) => regex.test(item.name));
  }
  // Filter by status
  if (params?.filter?.type) {
    filtered = filtered.filter((item) => item.status === params.filter.type);
  }
  // Filter by startDate
  if (params?.filter?.orderDate) {
    const gte = params.filter.orderDate.$gte;
    const lte = params.filter.orderDate.$lte;
    filtered = filtered.filter((item) => {
      const d = new Date(item.startDate);
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

// Returns a promise that resolves to the count of filtered sample deals
export function getCount(params: Record<string, any>): Promise<number> {
  // Use same filtering as getData, but return count
  return getData({ ...params, page: 1, count: 10000 }).then(
    (data) => data.length
  );
}
