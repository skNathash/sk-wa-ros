import SellerCatalogService from "~/services/SellerCatalogService";
import type { CouponInfo, SellerData } from "./types";
import { orderBy } from "lodash";
import CommonService from "~/services/CommonService";
import { B2B_DISCOUNT_TYPE, DISCOUNT_DECIMAL_PLACES } from "~/constants";

/**
 * Normalize the coupon-related keys returned by the cart API into a single,
 * UI-friendly shape. This is the single source of truth the cart UI reads from
 * to decide whether a coupon is applied, which coupon it is, and the totals
 * before/after the coupon discount.
 */
export const getCouponInfo = (seller: SellerData): CouponInfo => {
  const breakup = seller.discountInfo?.breakup?.find(
    (item) => item.source === "Coupon",
  );

  return {
    couponApplied: Boolean(seller.couponApplied),
    code: breakup?.code || null,
    source: breakup?.source ||  "Coupon",
    totalAfterCoupon: Number(seller.totalAfterCoupon) || 0,
    totalBeforeCoupon: Number(seller.totalBeforeCoupon) || 0,
    totalCouponDiscount: Number(seller.totalCouponDiscount) || 0,
  };
};

export const getData = async () => {
  const params = {
    includeRouteInfo: true,
    includePaymentConfig: true,
  };
  const response = await SellerCatalogService.getMultiCarts(params);
  const sellers = response.data?.data || [];
  const enriched = (sellers || []).map((seller: SellerData) => {
    const items = (seller.items || []).map((item: any) => {
      const mrp = Number(item.mrp) || 0;
      const purchasePrice = Number(item.purchasePrice) || 0;
      const discountPerc =
        mrp > purchasePrice && mrp > 0
          ? CommonService.calculateDiscount(
              mrp,
              purchasePrice,
              DISCOUNT_DECIMAL_PLACES,
              B2B_DISCOUNT_TYPE,
            )
          : 0;

      let sellingType = "UNIT";

      let availableStock = item.availableStock;
      let quantity = item.quantity;
      let actualQuantity = item.quantity;

      const stOptions = SellerCatalogService.getSellingTypes();
      const stFound = stOptions.find(
        (st: any) => st.apiValue === item.packType,
      );

      if (stFound && item.packType !== "Unit") {
        sellingType = stFound.value;
        availableStock = Math.floor(availableStock / (item.packQuantity || 1));
        quantity = SellerCatalogService.convertUnitsToPackQty(
          quantity,
          item.packQuantity || 1,
        );
      }

      return {
        ...item,
        selectedStockUom:
          item.selectedStockUom === "piece" ? "unit" : item.selectedStockUom,
        discountPerc,
        sellingType,
        packageQty: item.packQuantity || 1,
        availableStock,
        quantity,
        actualQuantity,
        // Normalize SK cart min/step from API keys onto the shared minQty/incrQty shape.
        minQty: item.b2bMinQuantity || 1,
        incrQty: item.incrementQuantity || 1,
      };
    });
    const selectedRoute = seller.routeInfo
      ? {
          routeId: seller.routeInfo.routeId,
          routeRefId: seller.routeInfo.routeRefId,
          deliveryDate: seller.routeInfo.deliveryDate,
          routeCode: seller.routeInfo.routeCode,
          description: seller.routeInfo.description,
        }
      : undefined;

    const couponInfo = getCouponInfo(seller);

    return {
      ...seller,
      // COD is not supported in this flow; drop it from the fetched options.
      payments: (seller.payments || []).filter(
        (payment) => payment.type !== "COD",
      ),
      isSkCart: Boolean(seller.isSkCart),
      items,
      selectedRoute,
      couponInfo,
      selectedPayment: null,
    };
  });

  return orderBy(enriched, "franchiseInfo.name", "asc").filter(
    (seller: SellerData) => seller.items && seller.items.length > 0,
  );
};
