import CartService from "~/services/CartService";
import PosService from "~/services/PosService";
import AuthService from "~/services/AuthService";
import ProductService from "~/services/ProductService";
import type { Deal } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import { EVENTS } from "~/constants";

export const removeCartItem = async ({
  deal,
  userId,
  cartType,
}: {
  deal: any;
  userId: string;
  cartType: string;
}) => {
  let response;
  try {
    // Use POS removal for buyer carts and "buy-from-other-retailer" flows
    if (cartType === "buyer" || cartType === "buy-from-other-retailer") {
      const cartId = deal.cartId;
      if (!cartId) {
        return { status: "error", msg: "Cart ID not found for buyer cart" };
      }

      const params: Record<string, any> = {
        cartId,
        itemId: deal.itemId || "",
      };

      // Prefer explicit retailerId from caller, fallback to deal data
      // if (deal?.buyFromOtherRetailer?.retailerId) {
      //   params.sellerId = deal.buyFromOtherRetailer.retailerId || "";
      // }

      response = await PosService.removeItemFromCart(params);
    } else {
      const payload = {
        type: "B2B",
        id: AuthService.getLoggedInUserId(true),
        fulfilledBy: deal.fulfilledBy || "",
        did: deal.id,
        whId: deal.whId || "",
      };
      response = await CartService.remove(payload);
    }
    if (response.statusCode !== 200) {
      return {
        status: "error",
        msg: response.data?.message || "Failed to remove item from cart",
      };
    }
    // Local cart is keyed per seller, so the removal has to be scoped too.
    const sellerId =
      cartType === "buyer" || cartType === "buy-from-other-retailer"
        ? deal?.buyFromOtherRetailer?.retailerId
        : undefined;
    CartService.removeFromCart(deal.id, sellerId);
    try {
      MiscService.createEvent(EVENTS.CART_ITEM_REMOVED, {
        dealId: deal.id,
        sellerId,
      });
    } catch (e) {
      // ignore
    }
    return { status: "success", msg: "Item removed successfully" };
  } catch (err: any) {
    return {
      status: "error",
      msg: err.message || "Failed to remove item from cart",
    };
  }
};

export const proceedBuyerCartCheckout = async ({
  cartId,
  paymentMode,
}: {
  cartId: string;
  paymentMode: {
    refNo: string;
    type: string;
    proof: any[];
    amount: number;
  };
}) => {
  try {
    const user = AuthService.getLoggedInUser();
    if (!user || !cartId) {
      return { status: "error", msg: "Missing user or cartId" };
    }
    const address = {
      landmark: user.landmark || "",
      city: user.city || "",
      district: user.district || "",
      state: user.state || "",
      pincode: user.pincode || "",
      line1: user.addressLine1 || "",
      line2: user.addressLine2 || "",
    };
    const payload: Record<string, any> = {
      cartId,
      shippingAddress: address,
      billingAddress: address,
      paymentType: "COD",
    };

    if (paymentMode.type !== "COD") {
      payload.paymentMode = paymentMode;
    }

    if (paymentMode.type === "PAYLATER") {
      payload.paymentType = "COD";
      payload.paymentMethod = "PAYLATER";
    }

    const response = await CartService.checkoutMyCart(payload);
    if (response.statusCode === 200) {
      // Extract order IDs from response if available
      const orderIds = response.data?.data?.order?.orderId || "";
      return {
        status: "success",
        msg: response.data?.message || "Checkout successful",
        orderIds,
      };
    } else {
      return {
        status: "error",
        msg: response.data?.message || "Checkout failed",
      };
    }
  } catch (err: any) {
    return { status: "error", msg: err.message || "Checkout failed" };
  }
};

export interface CartDetailsResponse {
  deals: Deal[];
  cartId: string;
  summary: {
    totalMRP: number;
    subTotal: number;
    totalDiscount: number;
    totalAmountBeforeTax: number;
    savingsPercentage: number;
    savings: number;
  };
}

export const getCartDetails = async (
  type: string,
  retailerId?: string,
): Promise<CartDetailsResponse> => {
  const userId = AuthService.getLoggedInUserId(true);

  if (!userId) {
    throw new Error("User ID not found");
  }

  if (type === "buyer" || retailerId) {
    let params: Record<string, any> = {};

    if (retailerId) {
      params.franchiseId = retailerId;
    }

    const response = await CartService.getMyCart(params);

    if (response.statusCode !== 200) {
      throw new Error(
        response.data?.message || "Failed to fetch POS cart details",
      );
    }

    // Transform buyer API response to use nested deal, brand, category, and other values
    const deals: Deal[] = [];
    let totalMRP = 0;
    let subTotal = 0;

    if (response.data?.data?.items) {
      response.data.data.items.forEach((item: any) => {
        const deal: Deal = {
          id: item.deal?.refId,
          _id: item.deal?.id,
          name: item.deal?.name,
          price: item.purchasePrice,
          mrp: item.mrp,
          displayPrice: item.mrp,
          discount:
            item.mrp && item.purchasePrice
              ? CommonService.roundedByDecimalPlace(
                  ((item.mrp - item.purchasePrice) / item.mrp) * 100,
                  2,
                )
              : 0,
          images: item.images,
          inCart: {
            status: true,
            qty: item.quantity,
          },
          maxQty: item.availableStock,
          minQty: 1,
          incrQty: 1,
          selectedSeller: {
            name: response.data?.data?.franchiseInfo?.name,
          },
          inventoryNew: item.products,
          fulfilledBy: item.fulfilledBy,
          brand: item.brand,
          category: item.category,
          isSfToSf: item.isSfToSf,
          whId: item.warehouseId,
          cartId: response.data?.data?._id,
          itemId: item.itemId,
          buyFromOtherRetailer: {
            retailerId: retailerId || "",
            status: retailerId ? true : false,
          },
        };

        deals.push(deal);
        totalMRP += deal.mrp * (deal.inCart?.qty ?? 0);
        subTotal += deal.price * (deal.inCart?.qty ?? 0);
      });
    }

    const savings = totalMRP - subTotal;
    const savingsPercentage =
      totalMRP > 0 ? Math.round((savings / totalMRP) * 100) : 0;

    return {
      deals,
      cartId: response.data?.data?._id || "",
      summary: {
        totalMRP,
        subTotal,
        totalDiscount: savingsPercentage,
        totalAmountBeforeTax: response.data?.totalAmountBeforeTax || subTotal,
        savingsPercentage,
        savings,
      },
    };
  } else {
    // Use CartService for normal type (default behavior)
    const response = await CartService.fetchCartDetails({
      type: "B2B", // Keep B2B for API compatibility
      id: userId,
    });

    if (response.statusCode !== 200) {
      throw new Error(response.data?.message || "Failed to fetch cart details");
    }

    let deals: Deal[] = [];

    if (response.data?.sellers) {
      response.data.sellers.forEach((seller: any) => {
        (seller.deals || []).forEach((deal: any) => {
          const dealObj: Deal = {
            id: deal.id,
            whId: seller.source,
            name: deal.name || "Unnamed Product",
            price: deal.price || 0,
            mrp: deal.mrp || deal.price || 0,
            discount:
              deal.discount ||
              (deal.mrp && deal.price
                ? CommonService.calculateDiscount(
                    deal.mrp,
                    deal.price,
                    0,
                    "markup",
                  )
                : 0),
            images: deal.images || [],
            inCart: {
              status: true,
              qty: deal.quantity || 1,
            },
            maxQty: deal.b2bMaxQuantity,
            minQty: deal.b2bMinQuantity || 1,
            incrQty: deal.incrementQuantity || 1,
            selectedSeller: {
              name: seller.name || "Unknown Seller",
            },
            inventoryNew: deal.products || [],
            fulfilledBy: deal.fulfilledBy || "",
            brand: deal.brand || {},
            category: deal.category || {},
            isSfToSf: deal.isSfToSf || false,
            displayPrice: deal.displayPrice || 0,
            _id: deal.id,
            priceSlabs: deal.priceSlabs,
          };

          // Prepare price slabs if available
          if (deal.priceSlabs && deal.priceSlabs.length > 0) {
            const { slabs, price, discount } = ProductService.preparePriceSlab(
              deal.priceSlabs,
              dealObj.maxQty,
              dealObj.mrp,
            );
            dealObj.priceSlabs = slabs;
          }

          deals.push(dealObj);
        });
      });
    }

    return {
      deals,
      cartId: response.data?._id || "",
      summary: response.data?.summary || {
        totalMRP: 0,
        subTotal: 0,
        totalDiscount: 0,
        totalAmountBeforeTax: 0,
        savingsPercentage: 0,
        savings: 0,
      },
    };
  }
};
