// Prepare params for API/data filtering for products
export const prepareParams = (
  filter: Record<string, any>,
  pagination: { activePage: number; rowsPerPage: number },
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

  if (filter.category && filter.category !== "All") {
    params.filter.category = filter.category;
  }

  if (filter.brand && filter.brand !== "All") {
    params.filter.brand = filter.brand;
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.date = {
      $gte: new Date(filter.dateRange[0]),
      $lte: new Date(filter.dateRange[1]),
    };
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

// Returns a promise that resolves to an array of sample product data, filtered and paginated
export function getData(params: Record<string, any>): Promise<any[]> {
  // Sample data for products
  const allData = [
    {
      name: "Apple iPhone 14 Pro Max",
      sku: "IP14PM-256GB-BLK",
      category: "Smartphones",
      brand: "Apple",
      stock: 12,
      price: 129999,
      date: "2025-07-10",
    },
    {
      name: "Samsung Galaxy S23 Ultra",
      sku: "SGS23U-512GB-GRY",
      category: "Smartphones",
      brand: "Samsung",
      stock: 8,
      price: 119999,
      date: "2025-07-11",
    },
    {
      name: "OnePlus 12R",
      sku: "OP12R-128GB-BLU",
      category: "Smartphones",
      brand: "OnePlus",
      stock: 20,
      price: 39999,
      date: "2025-07-12",
    },
    {
      name: "Xiaomi Redmi Note 13",
      sku: "RN13-256GB-GRN",
      category: "Smartphones",
      brand: "Xiaomi",
      stock: 15,
      price: 24999,
      date: "2025-07-13",
    },
    {
      name: "Sony WH-1000XM5",
      sku: "SONYWH1000XM5-BLK",
      category: "Headphones",
      brand: "Sony",
      stock: 7,
      price: 29999,
      date: "2025-07-13",
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
  // Filter by category
  if (params?.filter?.category) {
    filtered = filtered.filter(
      (item) => item.category === params.filter.category
    );
  }
  // Filter by brand
  if (params?.filter?.brand) {
    filtered = filtered.filter((item) => item.brand === params.filter.brand);
  }
  // Filter by date
  if (params?.filter?.date) {
    const gte = params.filter.date.$gte;
    const lte = params.filter.date.$lte;
    filtered = filtered.filter((item) => {
      const d = new Date(item.date);
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

// Returns a promise that resolves to the count of filtered sample products
export function getCount(params: Record<string, any>): Promise<number> {
  // Use same filtering as getData, but return count
  return getData({ ...params, page: 1, count: 10000 }).then(
    (data) => data.length
  );
}
