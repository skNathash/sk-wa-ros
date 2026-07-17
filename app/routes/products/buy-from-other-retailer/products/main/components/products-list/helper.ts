import SellerCatalogService from "~/services/SellerCatalogService";

export const prepareParams = (search: string, page: number, limit: number) => {
  return {
    page,
    limit,
    filter: {
      ...(search.trim() && { search: search.trim() }),
    },
  };
};

export const getData = async (
  params: Record<string, any>,
  distance: number | string,
) => {
  const response = await SellerCatalogService.getNetworkDeals(params, distance);
  const data = response.data?.data || [];
  return SellerCatalogService.formatProductResponse(data);
};

export const getCount = async (
  params: Record<string, any>,
  distance: number | string,
) => {
  const response = await SellerCatalogService.getNetworkDeals(
    {
      ...params,
      outputType: "count",
    },
    distance,
  );
  return response.data?.count || 0;
};
