import { format } from "date-fns";
import AuthService from "~/services/AuthService";
import ReportService from "~/services/ReportService";
import type { PaginationState } from "~/types/CommonTypes";

export interface RateRow {
  gstRate: string; // e.g. "5%", "12%"
  gstCollected: number;
  gstInward: number;
  netGstPayable: number;
}

const keys: Record<string, string> = {
  gstRate: "GSTRate",
  gstCollected: "GSTCollected",
  gstInward: "GSTInward",
  netGstPayable: "NetGSTPayable",
};

export const prepareParams = (
  filter: any,
  pagination: PaginationState,
  sort: any,
) => {
  const params: any = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {},
  };

  if (sort?.key && sort?.value) {
    params.sortBy = keys[sort.key] || sort.key;
    params.sortOrder = sort.value;
  }

  // date-range: support startDate/endDate
  if (filter?.startDate) {
    params.startDate = format(filter.startDate, "yyyy-MM-dd");
  }
  if (filter?.endDate) {
    params.endDate = format(filter.endDate, "yyyy-MM-dd");
  }

  if (filter.search && filter.search.trim()) {
    params.filter.search = filter.search.trim();
  }

  if (filter.gstRate && filter.gstRate.trim() && filter.gstRate !== "all") {
    params.gstRate = filter.gstRate.trim();
  }

  return params;
};

// Fetch Rate summary data.
export const getData = async (params: Record<string, any>) => {
  try {
    const fid = AuthService.getLoggedInUserId();
    const r = await ReportService.getGstDashboardRateSummary(fid, params);

    // Attach GST related keys if present, else defaults
    return (r.data.data || []).map((p: any, index: number) => ({
      _id: index,
      gstRate: p.GSTRate || "",
      gstCollected: p.GSTCollected || 0,
      gstInward: p.GSTInward || 0,
      netGstPayable: p.NetGSTPayable || 0,
      raw: p,
    }));
  } catch (error) {
    console.error("Error fetching GST rate summary data:", error);
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
    const r = await ReportService.getGstDashboardRateSummary(fid, p);

    return r.data?.count || 0;
  } catch (error) {
    console.error("Error fetching GST rate summary count:", error);
    return 0;
  }
};

export default { getData, getCount, prepareParams };
