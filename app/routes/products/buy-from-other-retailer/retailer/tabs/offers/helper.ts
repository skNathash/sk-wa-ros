import { merge } from "lodash";
import SellerCatalogService from "~/services/SellerCatalogService";

/**
 * Active promotional deals for a seller — same SellerCatalogService filter the
 * catalog PromotionalDeals strip uses (`isPromotionalDeal: true` + sellerId).
 */
export const getData = async (sellerId: string, limit = 50) => {
  try {
    const baseParams = SellerCatalogService.getBaseParamsToBuyProduct();
    const response = await SellerCatalogService.getProducts(
      merge(baseParams, {
        page: 1,
        count: limit,
        sellerId,
        filter: {
          isPromotionalDeal: true,
        },
      }),
    );
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data, {
      view: "buyer",
      sellerId,
    });
  } catch (error) {
    console.error("Error fetching promotional offers:", error);
    return [];
  }
};

/** Absolute rupees saved vs MRP for the "YOU SAVE" figure. */
export const getSavings = (deal: any): number => {
  const mrp = Number(deal?.mrp) || 0;
  const price = Number(deal?.price) || 0;
  if (mrp <= 0 || price <= 0 || mrp <= price) return 0;
  return Math.round(mrp - price);
};

/** Short supporting line under the title. */
export const getOfferDescription = (deal: any): string =>
  deal?.minQty > 0 ? `Order ${deal.minQty}+ units to unlock this deal` : "";
