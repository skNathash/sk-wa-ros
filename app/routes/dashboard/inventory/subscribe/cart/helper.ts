import { each } from "lodash";
import InventorySubscribeService from "~/services/InventorySubscribeService";

interface CloneData {
  quantity: number;
  isCloned?: boolean;
  clonedFrom?: string;
  name?: string;
  dealName?: string;
  mrp?: number;
  price?: number;
  unitType?: string;
  hsn?: string;
  gst?: number;
  description?: string;
}

interface CloneResult {
  status: "success" | "error";
  msg: string;
  data?: any;
}

export type CartItem = {
  _id: string;
  name: string;
  dealName: string;
  quantity: number;
  price: number;
  mrp: number;
  unitType: string;
  isCloned: boolean;
  clonedFrom?: string;
  duplicateItemAnimate?: boolean;
  globalQtyAnimate?: boolean;
  barcode?: string;
  totalPrice?: number;
  itemId: string;
  images?: string[];
  status?: string;
  totalValue?: number;
  totalValueAnimate?: boolean;
  barcodes?: string[];
  barcodeStr?: string;
  globalQty?: number;
  globalQtyApplied?: boolean;
  dealId?: string;
  unit?: string;
  barcodeOptions: string[];
  showbarcodeOption: boolean;
  // Optional fields updated via EditProductDetailModal and sent to inventory
  hsn?: string;
  gst?: number | string;
  description?: string;
  newBrand?: string;
  isConsumerOffer?: boolean;
  consumerOfferData?: any;
  consumerOfferPrice?: number;
  isLocalDeal?: boolean;
  b2cPriceConfig?: {
    discount: number;
    fixedPrice: number;
    isFixedPrice: boolean;
  };
};

function hasDuplicateData(products: any[]): { msg: string; index: number } {
  // If any product has consumer offer enabled, skip duplicate check
  if (products.some((p) => p.isConsumerOffer)) {
    return { msg: "", index: -1 };
  }

  // Track seen combinations and their first index
  let keys: Record<string, { firstIndex: number; product: any }> = {};

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Normalize identifying fields to avoid false positives caused by undefined/empty values or type differences
    const dealIdentifier = String(product.dealName || product.name || "");
    const mrp = Number(product.mrp) || 0;
    const price = Number(product.price) || 0;
    const unitType = String(product.unitType || "unit");

    const key = `${dealIdentifier}:${mrp}:${price}:${unitType}`;

    if (keys[key] === undefined) {
      keys[key] = {
        firstIndex: i,
        product: product,
      };
    } else if (product.isLocalDeal || keys[key].product.isLocalDeal) {
      // Allow duplicates when either item is marked as a local deal
      continue;
    } else {
      // Found a duplicate — return message and the duplicate item's index
      const duplicateProduct = product;
      const displayName =
        duplicateProduct.dealName || duplicateProduct.name || "product";
      const msg = `Duplicate product data found for \"${displayName}\". Please ensure name, mrp, price, and unit type are unique.`;
      return { msg, index: i };
    }
  }

  return { msg: "", index: -1 };
}

export function validateProducts(products: any[]): {
  msg: string;
  index: number;
} {
  let msg = "";
  let index = -1;

  // First, validate individual product fields
  each(products, (item, i) => {
    const qty = Number(item.quantity);
    const price = Number(item.price);
    const mrp = Number(item.mrp);

    if (item.isCloned && !item.dealName?.trim()) {
      msg = "Please enter deal name for duplicate item";
    } else if (!price) {
      msg = `Please enter price for "${item.name}"`;
    } else if (price < 0) {
      msg = `Invalid price for ${item.name}`;
    } else if (!mrp) {
      msg = `Please enter MRP for "${item.name}"`;
    } else if (mrp < 0) {
      msg = `Invalid MRP for "${item.name}"`;
    } else if (qty < 0) {
      msg = `Quantity cannot be negative for "${item.name}"`;
    } else if (!item.unitType) {
      msg = `Please select unit type for "${item.name}"`;
    }

    if (msg) {
      index = i;
      return false;
    }
    return true;
  });

  // If individual validations pass, check for duplicate data
  if (!msg) {
    const dup = hasDuplicateData(products);
    msg = dup.msg;
    if (msg) {
      // Return the index of the duplicate item found
      index = dup.index;
    }
  }

  return { msg, index };
}

export const clone = async (data: CloneData): Promise<CloneResult> => {
  try {
    const response = await InventorySubscribeService.createRequest({
      name: data.name || "",
      dealName: data.dealName || data.name || "",
      quantity: Number(data.quantity),
      isCloned: true,
      mrp: data.mrp || 0,
      price: data.price || 0,
      unitType: data.unitType || "unit",
      hsnNumber: data.hsn || "",
      gst: data.gst || "",
      description: data.description || "",
      ...(data.clonedFrom ? { clonedFrom: data.clonedFrom } : {}),
    });

    if (response.statusCode === 200) {
      return {
        status: "success",
        msg: "Item duplicated successfully",
        data: response.data?.data,
      };
    } else {
      return {
        status: "error",
        msg: "Failed to duplicate item",
      };
    }
  } catch (error) {
    console.error("Error cloning product:", error);
    return {
      status: "error",
      msg: "Failed to duplicate item",
    };
  }
};

export const removeItem = async (
  itemId: string,
  itemName: string,
): Promise<CloneResult> => {
  try {
    const response = await InventorySubscribeService.removeRequestItem(itemId);

    if (response.statusCode === 200) {
      return {
        status: "success",
        msg: `Product "${itemName}" removed successfully`,
      };
    } else {
      return {
        status: "error",
        msg: `Failed to remove product "${itemName}"`,
      };
    }
  } catch (error) {
    console.error("Error removing product:", error);
    return {
      status: "error",
      msg: `Failed to remove product "${itemName}"`,
    };
  }
};

export const clearCart = async (): Promise<CloneResult> => {
  try {
    const response = await InventorySubscribeService.clearCart();

    if (response.statusCode === 200) {
      return {
        status: "success",
        msg: "Cart cleared successfully",
      };
    } else {
      return {
        status: "error",
        msg: "Failed to clear cart",
      };
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
    return {
      status: "error",
      msg: "Failed to clear cart",
    };
  }
};
