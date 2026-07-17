import FranchiseService from "~/services/FranchiseService";

const getFranchises = async (query: string, page: number) => {
  const params: Record<string, any> = {
    page,
    limit: 10,
    sort: { name: 1 },
    filter: {},
  };
  if (query) {
    params.search = query;
  }
  const response = await FranchiseService.getFranchiseNetwork(params);
  return (response?.data?.data || []).map((item: any) => ({
    label: item.name || item.shopName || "",
    value: {
      franchiseId: item._id,
      name: item.name || item.shopName || "",
      refId: item.franchiseId || "",
      mobile: item.mobile || item.ownerDetails?.mobile || "",
      email: item.email || item.ownerDetails?.email || "",
    },
  }));
};

export const getData = async (query: string, page: number) => {
  return getFranchises(query, page);
};
