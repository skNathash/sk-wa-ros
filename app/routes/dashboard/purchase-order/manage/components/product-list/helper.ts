import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import PurchaseCartService from "~/services/PurchaseCartService";
import VendorService from "~/services/VendorService";
import type { PaginationState } from "~/types/CommonTypes";

export type SearchMode = "name" | "barcode";

/**
 * Which catalog the list reads from.
 * `vendor` — deals this vendor has supplied before (purchased-deals API).
 * `sk` — the full SK library (catalog/deals/popular API).
 */
export type CatalogSource = "vendor" | "sk";

export const CATALOG_SOURCES: { value: CatalogSource; label: string }[] = [
  { value: "vendor", label: "Vendor catalog" },
  { value: "sk", label: "SK Library" },
];

export type ProductListFilter = {
  search?: string;
  searchMode?: SearchMode;
  category?: any[];
  brand?: any[];
  catalog?: CatalogSource;
};

/** Cart line shaped like purchase-cart API `items[]` (+ client-only `discount`). */
export type CartLine = {
  dealId: string;
  dealRefId?: string;
  dealName: string;
  productName?: string;
  quantity: number | "";
  uom?: string;
  hsn?: string;
  mrp: number;
  purchasePrice: number;
  tax?: number;
  totalAmount: number;
  hasMrp?: boolean;
  hasBarcode?: boolean;
  hasExpiry?: boolean;
  isUsed?: boolean;
  imeiNumbers?: string[];
  isAvailable?: boolean;
  addedAt?: string;
  weight?: { unit?: string; [key: string]: any };
  /** Client-only: derived from mrp/purchasePrice for the discount input. */
  discount: number | "";
  cgst?: number;
  sgst?: number;
  [key: string]: any;
};

export type YouBoughtItem = {
  id: string;
  dealId: string;
  name: string;
  brandName: string;
  price: number;
  mrp: number;
  suggestedQty: number;
  initials: string;
  inCart: boolean;
};

export type ProductRow = {
  _id?: string;
  dealId?: string;
  name?: string;
  price?: number;
  mrp?: number;
  images?: string[];
  barcodes?: string[];
  brand?: { name?: string; id?: string };
  category?: { name?: string; id?: string };
  inCart?: boolean;
  [key: string]: any;
};

/**
 * Initial avatars carry the brand tint only — a per-product colour wheel reads
 * as decoration and fights the rest of the purchase-order surfaces.
 */
const INITIALS_COLOR = "tw:bg-primary/10 tw:text-primary";

export const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SKU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

export const getInitialsColor = (_name = "") => INITIALS_COLOR;

/** Params for the SK library API (catalog/deals/popular). */
const prepareSkParams = (
  filter: ProductListFilter,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      status: "Active",
    },
  };

  const categoryIds = (filter.category || [])
    .map((c: any) => c?.value?.id || c?.id)
    .filter(Boolean);
  if (categoryIds.length > 0) {
    params.filter["applicableCategory.categoryId"] = { $in: categoryIds };
  }

  const brandIds = (filter.brand || [])
    .map((b: any) => b?.value?.id || b?.id)
    .filter(Boolean);
  if (brandIds.length > 0) {
    params.filter["applicableBrand.brandId"] = { $in: brandIds };
  }

  const term = String(filter.search || "").trim();
  if (term) {
    if ((filter.searchMode || "name") === "barcode") {
      params.filter.barcodes = { $in: [term] };
    } else {
      params.search = term;
    }
  }

  return params;
};

/**
 * Params for the vendor catalog API (purchase/vendors/{id}/purchased-deals).
 * It filters on flat `categoryId` / `brandId` keys and a name regex, so the SK
 * library params cannot be reused as-is.
 */
const prepareVendorCatalogParams = (
  filter: ProductListFilter,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {} as Record<string, any>,
  };

  const categoryId = (filter.category || [])
    .map((c: any) => c?.value?.id || c?.id)
    .filter(Boolean)[0];
  if (categoryId) params.filter.categoryId = categoryId;

  const brandId = (filter.brand || [])
    .map((b: any) => b?.value?.id || b?.id)
    .filter(Boolean)[0];
  if (brandId) params.filter.brandId = brandId;

  const term = String(filter.search || "").trim();
  if (term) {
    if ((filter.searchMode || "name") === "barcode") {
      params.filter.barcodes = { $in: [term] };
    } else {
      params.filter.name = { $regex: term, $options: "i" };
    }
  }

  if (!Object.keys(params.filter).length) delete params.filter;

  return params;
};

export const getCatalogSource = (filter: ProductListFilter): CatalogSource =>
  filter.catalog === "sk" ? "sk" : "vendor";

export const prepareParams = (
  filter: ProductListFilter,
  pagination: PaginationState,
) =>
  getCatalogSource(filter) === "sk"
    ? prepareSkParams(filter, pagination)
    : prepareVendorCatalogParams(filter, pagination);

/** Vendor-catalog rows carry the deal id on `dealId`; the list keys off `_id`. */
const mapVendorCatalogRows = (rows: any[]): ProductRow[] =>
  VendorService.formatVendorCatalog(rows).map((row: any) => ({
    ...row,
    _id: String(row.dealId || row.id || ""),
    price: Number(row.price) || 0,
    brand: { name: row.brandName || "", id: row.brandId || "" },
    category: {
      name: row.applicableCategory?.categoryName || row.categoryName || "",
      id: row.applicableCategory?.categoryId || row.categoryId || "",
    },
  }));

export const getData = async (
  catalog: CatalogSource,
  vendorId: string,
  params: Record<string, any>,
): Promise<ProductRow[]> => {
  try {
    if (catalog === "vendor") {
      const response = await VendorService.getVendorCatalog(vendorId, params);
      return mapVendorCatalogRows(response?.data?.data || []);
    }

    const response = await InventorySubscribeService.getDeals(params);
    if (response.statusCode === 200 && Array.isArray(response.data?.data)) {
      const raw: any[] = response.data.data || [];
      // The deal formatter keeps only catalog fields, so carry the stock /
      // sales / last-buy keys the list renders across from the raw rows.
      return InventorySubscribeService.formatDealResponse(raw).map(
        (deal: any, index: number): ProductRow => ({
          ...deal,
          lastPurchasePrice: raw[index]?.lastPurchasePrice,
          loggedInUserStock: raw[index]?.loggedInUserStock,
          salesAnalytics: raw[index]?.salesAnalytics,
        }),
      );
    }
    return [];
  } catch (error) {
    console.error("Error fetching PO products:", error);
    return [];
  }
};

export const getCount = async (
  catalog: CatalogSource,
  vendorId: string,
  params: Record<string, any>,
) => {
  try {
    const countParams: Record<string, any> = { ...params, outputType: "count" };
    delete countParams.page;
    delete countParams.limit;
    delete countParams.sort;

    if (catalog === "vendor") {
      const response = await VendorService.getVendorCatalogCount(
        vendorId,
        countParams,
      );
      return (
        Number(response?.data?.count) || Number(response?.data?.totalCount) || 0
      );
    }

    const response = await InventorySubscribeService.getDealsCount(countParams);
    return (
      Number(response.data?.data?.totalDeals) ||
      Number(response.data?.count) ||
      Number(response.data?.totalCount) ||
      0
    );
  } catch (error) {
    console.error("Error fetching PO products count:", error);
    return 0;
  }
};

export const getCart = async (vendorId: string) => {
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

export const mapCartProducts = (
  cart: Record<string, any> | null,
): CartLine[] => {
  const items = Array.isArray(cart?.items) ? cart.items : [];

  return items.map((item: Record<string, any>) => {
    const mrp = Number(item.mrp) || 0;
    const purchasePrice = Number(item.purchasePrice) || 0;
    const quantity = Number(item.quantity) || 0;
    const totalAmount = Number(item.totalAmount) || 0;

    return {
      ...item,
      dealId: String(item.dealId),
      dealName: item.dealName,
      mrp,
      purchasePrice,
      quantity,
      totalAmount,
      // UI-only — cart API does not return discount %
      discount:
        mrp > 0
          ? CommonService.calculateDiscount(mrp, purchasePrice)
          : Number(item.discount) || 0,
    };
  });
};

export const markInCart = (
  products: ProductRow[],
  cartItems: CartLine[] | Set<string>,
): ProductRow[] => {
  const cartByDealId = new Map<string, CartLine>();
  if (cartItems instanceof Set) {
    cartItems.forEach((id) => {
      cartByDealId.set(id, {
        dealId: id,
        dealName: "",
        mrp: 0,
        purchasePrice: 0,
        quantity: 1,
        discount: 0,
        totalAmount: 0,
      });
    });
  } else {
    cartItems.forEach((item) => {
      if (item.dealId) cartByDealId.set(String(item.dealId), item);
    });
  }

  return products.map((p) => {
    const dealId = String(p._id || p.dealId || "");
    const cartItem =
      cartByDealId.get(dealId) || cartByDealId.get(String(p.dealId || ""));
    return {
      ...p,
      inCart: !!cartItem,
      cartQuantity: cartItem ? Number(cartItem.quantity) || 0 : 0,
    };
  });
};

export const getYouBought = async (
  vendorId: string,
  cartDealIds: Set<string>,
): Promise<YouBoughtItem[]> => {
  try {
    const response = await VendorService.getPurchasedDealsByFranchise(
      vendorId,
      {
        page: 1,
        limit: 12,
        sortBy: "quantity",
        sortOrder: -1,
      },
    );
    const rows: any[] = Array.isArray(response?.data?.data)
      ? response.data.data
      : [];

    return rows.map((item) => {
      const dealId = String(item.dealId || item.dealRefId || "");
      const name = item.name || item.productName || "";
      const price = Number(item.purchasePrice ?? item.lastPurchasePrice) || 0;

      return {
        id: String(item._id || dealId),
        dealId,
        name,
        brandName: item.applicableBrand?.brandName || "",
        price,
        mrp: Number(item.mrp) || 0,
        suggestedQty: Number(item.suggestedQuantity) || 1,
        initials: getInitials(name),
        inCart:
          cartDealIds.has(dealId) ||
          cartDealIds.has(String(item.dealRefId || "")),
      };
    });
  } catch (error) {
    console.error("Error fetching you-bought products:", error);
    return [];
  }
};

/**
 * Everything the desktop and mobile list surfaces render. `ProductList` owns
 * the state and the cart calls; the views only paint them.
 */
export type ProductListViewProps = {
  vendorId: string;
  vendorName?: string;
  products: ProductRow[];
  loadingProducts: boolean;
  hasMoreProducts: boolean;
  isLoadingMoreProducts: boolean;
  loadedCount: number;
  totalCount: number;
  youBought: YouBoughtItem[];
  loadingYouBought: boolean;
  addingDealId: string | null;
  onApplyFilter: () => void;
  onAddProduct: () => void;
  onAdd: (product: ProductRow) => void;
  onAddYouBought: (item: YouBoughtItem) => void;
  onLoadMore: () => void;
  onViewCart?: () => void;
};

/** Last price this franchise paid for the deal. Returns 0 if no last buy data exists. */
export const getLastBuyPrice = (product: ProductRow) =>
  Number(product.lastPurchasePrice) || 0;

/** On-hand quantity for the logged-in franchise. */
export const getStock = (product: ProductRow) =>
  Number(product.loggedInUserStock?.availableQuantity) || 0;

/** Units sold in the last 30 days — the demand side of the buy decision. */
export const getSoldPerMonth = (product: ProductRow) =>
  Number(product.salesAnalytics?.last30Days?.quantity) || 0;
