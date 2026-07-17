import { merge, sortBy } from "lodash";
import FranchiseService from "~/services/FranchiseService";

const getFranchises = async (
  query: string,
  page: number,
  params?: Record<string, any>,
) => {
  const p = merge(
    {},
    {
      page: page,
      count: 10,
      filter: {
        ...(query ? { search: query } : {}),
      },
      sort: "name",
      order: "asc",
    },
    params,
  );
  const response = await FranchiseService.getFranchises(p);
  return (response.data?.data || []).map((item: any) => ({
    label: item.name,
    value: {
      id: item.franchiseId,
      name: item.name || item.shopName,
      shopName: item.shopName,
      mobile: item.mobile,
      state: item.state,
      district: item.district,
      town: item.town,
      fid: item.franchiseId,
      pincode: item.pincode,
    },
  }));
};

export const getData = async (
  query: string,
  page: number,
  options?: { params?: Record<string, any> },
) => {
  return getFranchises(query, page, options?.params);
};
