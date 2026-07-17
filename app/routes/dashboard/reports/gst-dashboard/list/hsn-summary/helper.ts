import { endOfDay, format, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import ReportService from "~/services/ReportService";
import type { PaginationState } from "~/types/CommonTypes";

export interface HsnRow {
  hsnCode: string;
  products: number;
  gstCollected: number;
  gstInward: number;
  netGstPayable: number;
}

const keys: Record<string, string> = {
  hsnCode: "HSNCode",
  products: "ProductsCount",
  gstCollected: "GSTCollected",
  gstInward: "GSTInward",
  netGstPayable: "NetGSTPayable",
};

// Prepare params for GST HSN summary listing.
export const prepareParams = (
  filter: Record<string, any> = {},
  pagination: PaginationState,
  sort: Record<string, any> | undefined = undefined,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {},
  };

  if (sort?.key && sort?.value) {
    params.sortBy = keys[sort.key] || sort.key;
    params.sortOrder = sort.value;
  }

  // date-range: support either startDate/endDate or dateRange array
  if (filter?.startDate) {
    params.startDate = format(filter.startDate, "yyyy-MM-dd");
  }
  if (filter?.endDate) {
    params.endDate = format(filter.endDate, "yyyy-MM-dd");
  }

  if (filter.search && filter.search.trim()) {
    params.search = filter.search.trim();
  }

  return params;
};

// Fetch HSN summary data.
export const getData = async (params: Record<string, any>) => {
  try {
    const fid = AuthService.getLoggedInUserId();
    const r = await ReportService.getGstDashboardHsnSummary(fid, params);

    // Attach GST related keys if present, else defaults
    return (r.data.data || []).map((p: any, index: number) => ({
      _id: index,
      hsnCode: p.HSNCode || "",
      products: p.ProductsCount || 0,
      gstCollected: p.GSTCollected || 0,
      gstInward: p.GSTInward || 0,
      netGstPayable: p.NetGSTPayable || 0,
      raw: p,
    }));
  } catch (error) {
    console.error("Error fetching GST HSN summary data:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const p = {
      outputType: "count",
      ...params,
    };

    delete params.page;
    delete params.count;

    const fid = AuthService.getLoggedInUserId();
    const r = await ReportService.getGstDashboardHsnSummary(fid, p);

    return r.data?.count || 0;
  } catch (error) {
    console.error("Error fetching GST HSN summary count:", error);
    return 0;
  }
};

export default {
  getData,
  getCount,
  prepareParams,
};
