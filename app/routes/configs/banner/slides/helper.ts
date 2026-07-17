import BannerService from "~/services/BannerService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: { type: "B2B" },
  };

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await BannerService.list(params);
    return response.data?.data || [];
  } catch (err) {
    console.error("Error fetching banner slides:", err);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const p: Record<string, any> = { ...(params || {}), outputType: "count" };
    delete p.page;
    delete p.count;
    delete p.sort;

    const response = await BannerService.list(p);
    return response.data?.count || 0;
  } catch (err) {
    console.error("Error fetching banner slide count:", err);
    return 0;
  }
};
