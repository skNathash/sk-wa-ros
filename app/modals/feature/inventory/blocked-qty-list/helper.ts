import SellerCatalogService from "~/services/SellerCatalogService";

export const prepareParams = (filter: any) => {
  let params = {
    filter: {
      dealId: filter.dealId,
    },
  };
  return params;
};

export const getCount = async (filter: any) => {
  const res = await SellerCatalogService.getProducts({
    filter,
  });
  return res.data.length;
};

export const getData = async (params: any) => {
  const res = await SellerCatalogService.getProducts(params);
  const deals = res?.data?.data || [];
  if (Array.isArray(deals) && deals.length > 0) {
    return {
      blockData: deals[0].blockedInfo || [],
      deal: SellerCatalogService.formatProductResponse(deals)[0],
    };
  }
  return {
    blockData: [],
    deal: null,
  };
};
