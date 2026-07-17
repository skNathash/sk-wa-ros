import SellerCatalogService from "~/services/SellerCatalogService";

// Now the caller is expected to resolve the deal _id (raw id) and pass it as
// `dealRawId`. This helper will only fetch the activity log for that raw id.
const getData = async (params: Record<string, any>, dealRawId?: string) => {
  try {
    if (!dealRawId) return [];
    const response = await SellerCatalogService.getDealActivityLog(dealRawId);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching deal activity:", error);
    return [];
  }
};

const getCount = async (params: Record<string, any>, dealRawId?: string) => {
  try {
    if (!dealRawId) return 0;
    const data = await getData(params, dealRawId);
    return Array.isArray(data) ? data.length : 0;
  } catch (error) {
    console.error("Error fetching deal activity count:", error);
    return 0;
  }
};

const prepareParams = (
  filter: Record<string, any>,
  pagination: Record<string, any>
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {},
  };

  if (filter?.search) params.search = filter.search.trim();
  if (filter?.dateRange) params.dateRange = filter.dateRange;
  if (filter?.dealId) params.filter.dealId = filter.dealId;

  return params;
};

export { getData, getCount, prepareParams };
