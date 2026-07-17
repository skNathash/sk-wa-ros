import ProductService from "~/services/ProductService";

// Prepare filter parameters for API calls
export const prepareParams = (filter: any, pagination: any, sort: any) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  if (sort?.key && sort?.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  return params;
};

// Get brands data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await ProductService.getBrands(params);
    return response.data?.data || [];
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
};

// Get brands count from API
export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await ProductService.getBrands({
      ...params,
      outputType: "count",
    });
    if (response.statusCode === 200 && response.data?.count) {
      return response.data?.count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching brands count:", error);
    return 0;
  }
};
