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
    params.filter.joinDate = {
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

// Returns a promise that resolves to an array of sample personnel data, filtered and paginated
export function getData(params: Record<string, any>): Promise<any[]> {
  // Sample data for delivery personnel
  const allData = [
    {
      _id: "1",
      name: "John Smith",
      contact: "+91 98765 43210",
      email: "john.smith@delivery.com",
      status: "Active",
      codToHandover: 1500,
      balance: 2500,
      joinDate: "2024-01-15",
    },
    {
      _id: "2",
      name: "Sarah Johnson",
      contact: "+91 98765 43211",
      email: "sarah.johnson@delivery.com",
      status: "Active",
      codToHandover: 2200,
      balance: 1800,
      joinDate: "2024-02-20",
    },
    {
      _id: "3",
      name: "Mike Wilson",
      contact: "+91 98765 43212",
      email: "mike.wilson@delivery.com",
      status: "Inactive",
      codToHandover: 0,
      balance: 0,
      joinDate: "2023-11-10",
    },
    {
      _id: "4",
      name: "Emily Davis",
      contact: "+91 98765 43213",
      email: "emily.davis@delivery.com",
      status: "Active",
      codToHandover: 3200,
      balance: 3200,
      joinDate: "2024-03-05",
    },
    {
      _id: "5",
      name: "David Brown",
      contact: "+91 98765 43214",
      email: "david.brown@delivery.com",
      status: "Suspended",
      codToHandover: 800,
      balance: 500,
      joinDate: "2023-09-15",
    },
    {
      _id: "6",
      name: "Lisa Anderson",
      contact: "+91 98765 43215",
      email: "lisa.anderson@delivery.com",
      status: "Active",
      codToHandover: 1800,
      balance: 4200,
      joinDate: "2024-04-10",
    },
    {
      _id: "7",
      name: "Robert Taylor",
      contact: "+91 98765 43216",
      email: "robert.taylor@delivery.com",
      status: "Active",
      codToHandover: 950,
      balance: 1500,
      joinDate: "2024-01-25",
    },
    {
      _id: "8",
      name: "Maria Garcia",
      contact: "+91 98765 43217",
      email: "maria.garcia@delivery.com",
      status: "Inactive",
      codToHandover: 0,
      balance: 200,
      joinDate: "2023-12-05",
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

  // Filter by joinDate
  if (params?.filter?.joinDate) {
    const gte = params.filter.joinDate.$gte;
    const lte = params.filter.joinDate.$lte;
    filtered = filtered.filter((item) => {
      const d = new Date(item.joinDate);
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

// Returns a promise that resolves to the count of filtered personnel
export function getCount(params: Record<string, any>): Promise<number> {
  // Use same filtering as getData, but return count
  return getData({ ...params, page: 1, count: 10000 }).then(
    (data) => data.length
  );
}
