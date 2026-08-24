export interface ReorderItem {
  id: string;
  name: string;
  brand: string;
  image?: string;
  price: number;
  mrp: number;
  savings: number;
  stock: number;
  velocity: number; // weekly sale velocity
  previousSeller: string;
  tag?: "SK" | "PEER" | "LOCAL" | string;
  isOutOfStock: boolean;
  maxStock: number;
}

export const getFirstSeller = (product: any) => {
  return product?.sellers?.[0] || null;
};

export const mapProductToReorderItem = (product: any): ReorderItem => {
  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || 0;
  const savings = Math.max(0, mrp - price);
  const seller = getFirstSeller(product);
  const maxStock = Number(product?.sellers?.[0]?.qty) || 0;
  let tag: ReorderItem["tag"] = "SK";
  if (product.isLocalDeal) {
    tag = "LOCAL";
  } else if (seller) {
    tag = seller.isSkSeller ? "SK" : "SELLER";
  }

  const imageObj = Array.isArray(product.images) ? product.images[0] : null;
  const imageUrl =
    typeof imageObj === "string"
      ? imageObj
      : imageObj?.image || imageObj?.assetId || undefined;

  return {
    id: product._id || product.id,
    name: product.name || "",
    brand: product.brand?.name || product.companyName || "",
    image: imageUrl,
    isOutOfStock: maxStock === 0,
    maxStock,
    price,
    mrp,
    savings,
    // Logged-in user's own stock for the product.
    stock: Number(product.loggedInUserStock) || 0,
    // Weekly sales velocity from the logged-in user's last-7-days sales.
    velocity: Number(product.vsl ?? product.velocity) || 0,
    // Only the actual previous purchase source — no seller/SK fallback; the
    // card drops the segment when the API doesn't carry one.
    previousSeller:
      product.lastPurchaseFrom || product.lastPurchase?.from || "",
    tag,
  };
};
