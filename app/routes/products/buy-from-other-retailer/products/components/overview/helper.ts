import SellerCatalogService from "~/services/SellerCatalogService";

export const getAllData = async (
  params: Record<string, any> = {},
  distance?: number | string,
) => {
  try {
    const response = await SellerCatalogService.getNetworkDeals(
      {
        ...params,
        filter: {
          // availableQuantity: { $gt: 0 },
        },
      },
      distance,
    );
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data);
  } catch (error) {
    console.error("Error fetching all network deals:", error);
    return [];
  }
};

export const getLowStock = async (
  params: Record<string, any> = {},
  distance?: number | string,
) => {
  try {
    const lowStockParams =
      SellerCatalogService.getRecommendNetworkMyLowStockParams({
        ...params,
        filter: {
          // availableQuantity: { $gt: 0 }
        },
      });
    const response = await SellerCatalogService.getNetworkDeals(
      lowStockParams,
      distance,
    );
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data);
  } catch (error) {
    console.error("Error fetching low stock network deals:", error);
    return [];
  }
};

export const getOutofStock = async (
  params: Record<string, any> = {},
  distance?: number | string,
) => {
  try {
    const outOfStockParams =
      SellerCatalogService.getRecommendNetworkMyOutofStockParams({
        ...params,
        filter: {
          // availableQuantity: { $gt: 0 }
        },
      });
    const response = await SellerCatalogService.getNetworkDeals(
      outOfStockParams,
      distance,
    );
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data);
  } catch (error) {
    console.error("Error fetching out of stock network deals:", error);
    return [];
  }
};

export const getAllDataCount = async (
  params: Record<string, any> = {},
  distance?: number | string,
) => {
  try {
    const response = await SellerCatalogService.getNetworkDeals(
      {
        ...params,
        outputType: "count",
        filter: {
          // availableQuantity: { $gt: 0 },
        },
      },
      distance,
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching all network deals count:", error);
    return 0;
  }
};

export const getLowStockCount = async (
  params: Record<string, any> = {},
  distance?: number | string,
) => {
  try {
    const lowStockParams =
      SellerCatalogService.getRecommendNetworkMyLowStockParams({
        ...params,
        outputType: "count",
        filter: {
          // availableQuantity: { $gt: 0 },
        },
      });
    const response = await SellerCatalogService.getNetworkDeals(
      lowStockParams,
      distance,
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching low stock network deals count:", error);
    return 0;
  }
};

export const getOutofStockCount = async (
  params: Record<string, any> = {},
  distance?: number | string,
) => {
  try {
    const outOfStockParams =
      SellerCatalogService.getRecommendNetworkMyOutofStockParams({
        ...params,
        outputType: "count",
        filter: {
          // availableQuantity: { $gt: 0 },
        },
      });
    const response = await SellerCatalogService.getNetworkDeals(
      outOfStockParams,
      distance,
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching out of stock network deals count:", error);
    return 0;
  }
};
