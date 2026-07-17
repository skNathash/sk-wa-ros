import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

/** A single product row shown in the bulk barcode selector. */
export type BulkProductItem = {
  /** Seller deal id (dealId). */
  id: string;
  /** Human-facing deal reference id. */
  refId: string;
  name: string;
  mrp: number;
  /** Available barcodes for this product (may be empty). */
  barcodes: string[];
  /** The barcode chosen for printing — set once the product is selected. */
  selectedBarcode?: string;
  /**
   * Number of prints (copies) to produce for this product. Defaults to 1.
   * `null` means the user cleared the field — treated as "not provided".
   */
  quantity?: number | null;
  stock: number;
  img?: any;
};

export type ProductsFilter = {
  search?: string;
  brandId?: string;
  categoryId?: string;
};

export type ProductsSort = { key?: string; value?: SortValue } | undefined;

/** Builds the seller-deals query params from the current filter/pagination/sort. */
export const prepareParams = (
  filter: ProductsFilter,
  pagination: PaginationState,
  sort?: ProductsSort,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    showAllDeals: true,
    filter: {},
    sort: { dealName: 1 },
  };

  if (sort?.key && sort?.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  if (filter.brandId) {
    params.filter["applicableBrand.brandId"] = { $in: [filter.brandId] };
  }

  if (filter.categoryId) {
    params.filter["applicableCategory.categoryId"] = {
      $in: [filter.categoryId],
    };
  }

  return params;
};

/** Maps a formatted seller deal into a {@link BulkProductItem}. */
const toBulkProduct = (p: any): BulkProductItem => ({
  id: p._id,
  refId: p.id,
  name: p.name,
  mrp: Number(p.mrp) || 0,
  barcodes: Array.isArray(p.barcodes) ? p.barcodes.filter(Boolean) : [],
  stock: Number(p.actualMaxQty ?? p.maxQty ?? 0) || 0,
  img: p.images,
});

/** Fetches a page of products for the bulk barcode selector. */
export const getData = async (
  params: Record<string, any>,
): Promise<BulkProductItem[]> => {
  try {
    const response = await SellerCatalogService.getProducts(params, {
      showOutOfStock: true,
    });
    const formatted = SellerCatalogService.formatProductResponse(
      response.data?.data || [],
    );
    return formatted.map(toBulkProduct);
  } catch (error) {
    console.error("Error fetching bulk barcode products:", error);
    return [];
  }
};

/** Fetches the total product count for the current filter. */
export const getCount = async (
  params: Record<string, any>,
): Promise<number> => {
  try {
    const response = await SellerCatalogService.getProducts(
      { ...params, outputType: "count" },
      { showOutOfStock: true },
    );
    if (response.statusCode === 200) {
      return Number(response.data?.count) || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching bulk barcode products count:", error);
    return 0;
  }
};
