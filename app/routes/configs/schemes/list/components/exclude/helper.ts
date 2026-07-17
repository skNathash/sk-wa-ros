import FranchiseService from "~/services/FranchiseService";
import type { PaginationState } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";

export const prepareParams = (
  filter: { search?: string; alpha?: string } = {},
  pagination: PaginationState,
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    limit: pagination?.rowsPerPage,
    filter: {},
    // sort: { name: 1 },
  };

  const { search, alpha } = filter || {};

  if (search) {
    params.filter["name"] = { $regex: search, $options: "i" };
  }

  if (alpha) {
    params.filter["name"] = CommonService.prepareAlphaRegexFilter(alpha);
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await FranchiseService.getAccessConfig(params || {});
    const respData = response.data?.data;

    let list: any[] = [];
    if (Array.isArray(respData)) {
      list = respData[0]?.schemeExcludeFranchiseList || respData;
    } else if (respData && respData.schemeExcludeFranchiseList) {
      list = respData.schemeExcludeFranchiseList;
    } else {
      list = respData || [];
    }

    // Client-side search and alpha filtering
    const { filter: filterParams, page = 1, limit = 10 } = params;
    const { name } = filterParams || {};
    
    let filteredList = [...list];

    if (name) {
      if (typeof name === "string") {
        filteredList = filteredList.filter((item) =>
          item.name?.toLowerCase().includes(name.toLowerCase()),
        );
      } else if (name.$regex) {
        // Handle regex from prepareParams
        const regex = new RegExp(name.$regex, name.$options || "i");
        filteredList = filteredList.filter((item) => regex.test(item.name));
      }
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedList = filteredList.slice(startIndex, startIndex + limit);

    return {
      data: paginatedList,
      totalCount: filteredList.length,
      accessConfig: Array.isArray(respData) ? respData[0] : respData,
    };
  } catch (error) {
    console.error(error);
    return { data: [], totalCount: 0, accessConfig: null };
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    // Since we are doing client-side filtering, we need to know the filtered count.
    // However, getData now returns totalCount of filtered data.
    // But if getCount is called separately, we should probably do the same logic.
    const res = await getData(params);
    return res.totalCount;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
