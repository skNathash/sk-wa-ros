import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import PosService from "~/services/PosService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { BuyCartType, Deal } from "~/types/CommonTypes";

interface AddToCartParams {
  deal: Deal;
  quantity: number;
  cartType: BuyCartType;
}

interface AddToCartResponse {
  status: boolean;
  message: string;
  data?: any;
}

export const addToCartHelper = async ({
  deal,
  quantity,
  cartType,
}: AddToCartParams): Promise<AddToCartResponse> => {
  const userId = AuthService.getLoggedInUserId(true);

  if (!userId) {
    return {
      status: false,
      message: "User not authenticated",
    };
  }

  try {
    let apiResponse;

    if (cartType === "buyer" || cartType === "buy-from-other-retailer") {
      // Use PosService for buyer type

      const params: Record<string, any> = {
        quantity: quantity,
        dealId: deal._id,
      };

      if (cartType === "buy-from-other-retailer" || cartType === "buyer") {
        params.sellerId = deal.buyFromOtherRetailer?.retailerId;

        if (deal.sellingType && deal.sellingType !== "UNIT") {
          const sp = SellerCatalogService.getSellingTypes().find(
            (st: any) => st.value === deal.sellingType,
          );
          params.quantity = (deal.packageQty || 0) * quantity;
          params.packType = sp?.apiValue || "";
          params.packQuantity = deal.packageQty || 0;
          params.requestedPackQuantity = quantity;
        }
      }

      apiResponse = await PosService.addItemToCart(params);
    } else {
      // Use CartService for normal type
      apiResponse = await CartService.addToCart("B2B", userId, {
        fulfilledBy: deal.fulfilledBy,
        quantity: quantity,
        whId: deal.isSfToSf ? deal.fulfilledBy : deal.whId || 1,
        _id: deal.id,
        ...(deal.isSfToSf && { processType: "SFTOSF" }),
      });
    }

    // Check for non-200 status code
    if (apiResponse?.statusCode !== 200) {
      throw new Error(apiResponse?.data?.message || "Failed to update cart");
    }

    // Update local storage — scoped to the seller so the same deal bought from
    // another seller doesn't read as "in cart" here.
    CartService.addToCartLocal(
      deal.id,
      quantity,
      cartType === "buyer" || cartType === "buy-from-other-retailer"
        ? deal.buyFromOtherRetailer?.retailerId
        : undefined,
    );

    // Trigger cart count update event
    window.dispatchEvent(new CustomEvent("cart-count-updated"));

    return {
      status: true,
      message: "Product added to cart successfully!",
      data: apiResponse,
    };
  } catch (error) {
    console.error("Error adding to cart:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update cart";

    return {
      status: false,
      message: errorMessage,
    };
  }
};
