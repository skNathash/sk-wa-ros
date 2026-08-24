import PurchaseCartService from "~/services/PurchaseCartService";
import VendorService from "~/services/VendorService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export type PurchasedDealByFranchise = {
  dealRefId: string;
  name: string;
  productId?: string;
  productName?: string | null;
  weight?: { value: number; unit: string };
  uom?: string;
  mrp: number;
  hsn?: string;
  tax?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  lastPurchaseDate?: string;
  lastPurchaseQuantity?: number;
  lastPurchasePrice?: number;
  lastOrderId?: string;
  totalQuantityPurchased?: number;
  totalPurchaseValue?: number;
  _id: string;
  dealId: string;
  purchasePrice: number;
  orderCount?: number;
  suggestedQuantity?: number;
  applicableMenu?: {
    id: string;
    menuId: string;
    menuName: string;
  };
  applicableBrand?: {
    id: string;
    brandId: string;
    brandName: string;
  };
  applicableCategory?: {
    id: string;
    categoryId: string;
    categoryName: string;
  };
};

export type PurchaseCartItem = {
  dealId?: string;
  [key: string]: any;
};

export type PurchaseCartSummary = {
  totalItems: number;
  totalQuantity: number;
  totalMrp: number;
  totalPurchaseValue: number;
  totalTax: number;
  unavailableItems: number;
};

export type PurchaseCartData = {
  _id?: string;
  items?: PurchaseCartItem[];
  cartSummary?: PurchaseCartSummary;
  [key: string]: any;
} | null;

export type VendorReorderItem = {
  id: string;
  dealId: string;
  dealRefId: string;
  name: string;
  productId?: string;
  brandName: string;
  brandCode: string;
  categoryName: string;
  menuName: string;
  price: number;
  mrp: number;
  uom: string;
  lastPurchaseDate?: string;
  lastPurchaseQty?: number;
  lastPurchasePrice?: number;
  lastOrderId?: string;
  totalQuantityPurchased: number;
  totalPurchaseValue: number;
  suggestedQty: number;
  orderCount: number;
  inCart: boolean;
  raw: PurchasedDealByFranchise;
};

export const toReorderItem = (
  item: PurchasedDealByFranchise,
): VendorReorderItem => {
  const brandName = item.applicableBrand?.brandName || "";
  const price = Number(item.purchasePrice ?? item.lastPurchasePrice) || 0;

  return {
    id: item._id,
    dealId: item.dealId || "",
    dealRefId: item.dealRefId || "",
    name: item.name || item.productName || "",
    productId: item.productId,
    brandName,
    brandCode: brandName.slice(0, 4) || "SKU",
    categoryName: item.applicableCategory?.categoryName || "",
    menuName: item.applicableMenu?.menuName || "",
    price,
    mrp: Number(item.mrp) || 0,
    uom: item.uom || "piece",
    lastPurchaseDate: item.lastPurchaseDate,
    lastPurchaseQty: item.lastPurchaseQuantity,
    lastPurchasePrice: item.lastPurchasePrice,
    lastOrderId: item.lastOrderId,
    totalQuantityPurchased: Number(item.totalQuantityPurchased) || 0,
    totalPurchaseValue: Number(item.totalPurchaseValue) || 0,
    suggestedQty: Number(item.suggestedQuantity) || 1,
    orderCount: Number(item.orderCount) || 0,
    inCart: false,
    raw: item,
  };
};

/** Fetch the active purchase cart for a vendor. */
export const getCart = async (vendorId: string): Promise<PurchaseCartData> => {
  try {
    const response = await PurchaseCartService.getActive({
      vendorId,
      mine: true,
    });
    return response?.statusCode === 200 ? response.data?.data || null : null;
  } catch (error) {
    console.error("Error fetching purchase cart:", error);
    return null;
  }
};

/**
 * Mark each reorder row with whether its deal is already in the cart.
 */
export const mapInCart = (
  reorderData: VendorReorderItem[],
  cartItems: PurchaseCartItem[] = [],
): VendorReorderItem[] => {
  const cartDealIds = new Set(
    cartItems.map((item) => String(item.dealId || "")).filter(Boolean),
  );

  return reorderData.map((item) => ({
    ...item,
    inCart: cartDealIds.has(item.dealId) || cartDealIds.has(item.dealRefId),
  }));
};

export const prepareFilterParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: SortProps,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 20,
  };

  if (filter.search?.trim()) {
    params.search = filter.search.trim();
  }

  if (sort?.key && sort.value) {
    params.sortBy = sort.key;
    params.sortOrder = sort.value === "asc" ? 1 : -1;
  }

  return params;
};

export const getData = async (
  vendorId: string,
  params: Record<string, any>,
) => {
  try {
    const response = await VendorService.getPurchasedDealsByFranchise(
      vendorId,
      params,
    );
    const rows: PurchasedDealByFranchise[] = Array.isArray(response?.data?.data)
      ? response.data.data
      : [];
    return rows.map(toReorderItem);
  } catch (error) {
    console.error("Error fetching vendor reorder items:", error);
    return [];
  }
};

export const getCount = async (
  vendorId: string,
  params: Record<string, any>,
) => {
  try {
    const response = await VendorService.getPurchasedDealsByFranchise(
      vendorId,
      {
        ...params,
        outputType: "count",
      },
    );
    return (
      Number(response?.data?.count) ||
      Number(response?.data?.totalCount) ||
      Number(response?.data?.total) ||
      0
    );
  } catch (error) {
    console.error("Error fetching vendor reorder count:", error);
    return 0;
  }
};
