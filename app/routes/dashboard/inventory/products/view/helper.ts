import SellerCatalogService from "~/services/SellerCatalogService";

export const getSalesDetails = (data: any) => {
  return {
    sellInLooseQty: data.sellInLooseQty,
    lastOrderDate: data.lastCustomerOrderDate,
    lastOrderQty: data._lastCustomerOrderQty,
    salesData: data.salesData,
    lastCustomerOrderDate: data.lastCustomerOrderDate,
    lastCustomerOrderQty: data._lastCustomerOrderQty,
  };
};

export const getPurchaseDetails = (data: any) => {
  return {
    purchaseData: data.purchaseData,
    lastPurchasedDate: data.lastOrderDate,
    lastPurchasedUnits: data.lastOrderQty,
    lastInwardedDate: data.lastInwardedDate,
    lastIntakeUnits: data.purchaseData?.qty,
    openOrder: data.openOrder,
  };
};

export const getPricingDetails = (data: any) => {
  return {
    mrp: data.mrp,
    b2bprice: data.b2bprice,
    purchasePrice: data.pp,
    price: data._finalSellingPrice,
    pnl: data._pnl,
    networkPnl: data._networkPnl,
    networkSellingPrice: data.networkSellingPrice,
  };
};

export const getDetails = async (id: string) => {
  const response = await SellerCatalogService.getProducts(
    {
      filter: { dealId: id },
      showAllDeals: true,
    },
    {
      showOutOfStock: true,
    },
  );
  const mainDeal = SellerCatalogService.formatProductResponse(
    response.data?.data || [],
  )[0];
  return {
    ...mainDeal,
  };
};
