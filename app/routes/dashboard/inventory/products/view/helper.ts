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

/**
 * Top deals sitting in the same category as the product being viewed — feeds
 * the "Similar in category" block of the side pane. Sorted by name so the
 * preview stays stable between visits.
 */
export const getCategoryDeals = async (
  categoryId: string,
  { count = 6, excludeDealId }: { count?: number; excludeDealId?: string } = {},
) => {
  if (!categoryId) return [];

  const params: Record<string, any> = {
    page: 1,
    // Fetch one extra so dropping the current product still fills the list.
    count: count + 1,
    sort: { dealName: 1 },
    filter: {
      "applicableCategory.categoryId": categoryId,
    },
  };

  try {
    const response = await SellerCatalogService.getProducts(params, {
      showOutOfStock: true,
    });
    const deals = SellerCatalogService.formatProductResponse(
      response.data?.data || [],
    );
    return deals
      .filter((deal: any) => deal._id !== excludeDealId)
      .slice(0, count);
  } catch (error) {
    console.error(error);
    return [];
  }
};

/**
 * Deals from the same brand as the product being viewed — feeds the brand rail
 * that stands in for the variants block on products that aren't grouped.
 */
export const getBrandDeals = async (
  brandId: string,
  { count = 10, excludeDealId }: { count?: number; excludeDealId?: string } = {},
) => {
  if (!brandId) return [];

  const params: Record<string, any> = {
    page: 1,
    // One extra so dropping the current product still fills the rail.
    count: count + 1,
    sort: { dealName: 1 },
    filter: {
      "applicableBrand.brandId": brandId,
    },
  };

  try {
    const response = await SellerCatalogService.getProducts(params, {
      showOutOfStock: true,
    });
    const deals = SellerCatalogService.formatProductResponse(
      response.data?.data || [],
    );
    return deals
      .filter((deal: any) => deal._id !== excludeDealId)
      .slice(0, count);
  } catch (error) {
    console.error(error);
    return [];
  }
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
