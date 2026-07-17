import MasterEmpService from "~/services/MasterEmpService";

export const prepareParams = (filter: any, pagination: any, sort: any) => {
  const params: any = {
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
    filter: {},
    sort: "name",
    order: "asc",
  };

  if (filter?.search?.trim()) {
    const searchTerm = filter.search.trim();
    params.filter.search = searchTerm;
  }

  if (filter?.type && filter?.type !== "All") {
    if (filter.type === "SK Retailer") {
      params.subType = { $in: ["SFSELLER", "SFBUYER"] };
    } else if (filter.type === "SK Seller") {
      params.networkType = "SKSELLER";
    } else if (filter.type === "SK Buyer") {
      params.networkType = "SKBUYER";
    } else if (filter.type === "SK Master") {
      params.networkType = "SKMASTER";
    }
  }

  if (filter?.state) {
    if (filter.state !== "All") {
      params.filter.state = filter.state;
    }
  }

  if (filter?.district) {
    if (filter.district !== "All") {
      params.filter.district = filter.district;
    }
  }

  // if (sort?.key && sort?.value) {
  //   params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  // }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await MasterEmpService.getFranchises(params);
    return response?.data?.data || [];
  } catch (error) {
    console.error("Error fetching franchises:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const { page, limit, ...rest } = params;
    const response = await MasterEmpService.getFranchisesCount({
      ...rest,
    });
    const count = response?.data?.data?.count ?? 0;
    return count || 0;
  } catch (error) {
    console.error("Error fetching franchises count:", error);
    return 0;
  }
};
