import SellerCatalogService from "~/services/SellerCatalogService";

export type ReorderBadgeType = "savings" | "new-sku";

export type ReorderProduct = {
  id: string;
  name: string;
  brandName: string;
  brandCode: string;
  price: number;
  stock: number;
  maxStock: number;
  velocity: number;
  velocityUnit: string;
  suggestedQty: number;
  badgeType: ReorderBadgeType;
  badgeLabel: string;
  raw?: any;
  isOutOfStock: boolean;
};

export type ReorderSummary = {
  retailerName: string;
  basedOn: string;
  totalValue: number;
  shipsToday: boolean;
  itemCount: number;
};

/**
 * Builds the network reorder params scoped to a single seller — the
 * `sellerIds` filter restricts the recommended deals to this retailer.
 */
export const prepareParams = (
  retailerId: string,
  pagination: { page: number; limit: number } = { page: 1, limit: 20 },
) => {
  const params: Record<string, any> = {
    page: pagination.page,
    limit: pagination.limit,
    filter: {},
    sellerIds: [retailerId],
  };

  return SellerCatalogService.getNetworkReorderParams(params);
};

export const getData = async (params: Record<string, any>) => {
  try {
    // Distance "all": results are already scoped to this seller, so don't
    // clip them by delivery radius.
    const response = await SellerCatalogService.getNetworkDeals(params, "all");
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data, {
      // `sellerIds` scopes the results to one seller — key the cart lookup on it.
      sellerId: params?.sellerIds?.[0],
    });
  } catch (error) {
    console.error("Error fetching retailer reorder products:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const countParams = { ...params, outputType: "count" };
    const response = await SellerCatalogService.getNetworkDeals(
      countParams,
      "all",
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching retailer reorder products count:", error);
    return 0;
  }
};

/** Maps a formatted seller deal into the reorder card display shape. */
export const mapToReorderProduct = (product: any): ReorderProduct => {
  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || 0;
  const savings = Math.max(0, mrp - price);
  const stock = Number(product.loggedInUserStock) || 0;
  const brandName = product.brand?.name || product.companyName || "";
  const isNewSku = stock === 0;

  const maxStock = Number(product?.sellers?.[0]?.qty) || 0;
  const isOutOfStock = maxStock === 0;

  return {
    id: product._id || product.id,
    isOutOfStock,
    name: product.name || "",
    brandName,
    brandCode: brandName.slice(0, 4) || "SKU",
    price,
    stock,
    maxStock,
    velocity: Number(product.velocity) || 0,
    velocityUnit: "day",
    suggestedQty: Number(product.moq) || 1,
    badgeType: isNewSku ? "new-sku" : "savings",
    badgeLabel: isNewSku
      ? "First order · new SKU"
      : savings > 0
        ? `₹${savings} below MRP`
        : "Bought before",
    raw: product,
  };
};

export const prepareSummary = (
  retailerName: string,
  products: ReorderProduct[],
  totalRecords: number,
): ReorderSummary => {
  const totalValue = products.reduce(
    (sum, p) => sum + p.price * p.suggestedQty,
    0,
  );

  return {
    retailerName,
    basedOn: "your purchase history",
    totalValue,
    shipsToday: false,
    itemCount: totalRecords || products.length,
  };
};
