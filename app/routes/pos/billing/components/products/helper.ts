import CartService from "~/services/CartService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState, SellerDeal } from "~/types/CommonTypes";

export interface PosBillingDeal extends SellerDeal {
  origMaxQty?: number;
}

interface Filter {
  search?: string;
  status?: string;
  alpha?: string;
  menu?: any[];
  brand?: any[];
  category?: any[];
  customerType?: string;
  assisted?: boolean;
  searchBy?: "barcode" | "name";
}

export const prepareParams = (
  filter: Filter,
  pagination: PaginationState,
  assisted?: boolean,
) => {
  const isB2b = (filter.customerType || "").toLowerCase() === "b2b";
  const allowReserve = isB2b || !!filter.assisted;

  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      status: "Active",
    },
  };

  // For assisted orders only show in-stock products. For normal billing we
  // show out-of-stock deals too (they expose an "Add Stock" action).
  // if (assisted) {
  //   params.filter.availableQuantity = {
  //     $gt: 0,
  //   };
  // }

  // Exclude local deals for the B2B order flow (both POS and assisted b2b)
  if (isB2b) {
    params.filter.isLocalDeal = { $ne: true };
  }

  // Handle search. Barcode mode (default) filters by exact barcode match,
  // name mode uses the backend's name/id search.
  if (filter.search?.trim()) {
    const term = filter.search.trim();
    if ((filter.searchBy || "barcode") === "barcode") {
      params.filter.barcodes = { $in: [term] };
    } else {
      params.filter.search = term;
    }
  }

  // Handle menu (array of objects)
  if (Array.isArray(filter.menu) && filter.menu.length > 0) {
    params.filter["menu.id"] = {
      $in: filter.menu.map((item: any) => item?.value?.id),
    };
  }

  // Handle brand (array of objects)
  if (Array.isArray(filter.brand) && filter.brand.length > 0) {
    params.filter["applicableBrand.brandId"] = {
      $in: filter.brand.map((item: any) => item?.value?.id),
    };
  }

  // Handle category (array of objects)
  if (Array.isArray(filter.category) && filter.category.length > 0) {
    params.filter["applicableCategory.categoryId"] = {
      $in: filter.category.map((item: any) => item?.value?.id),
    };
  }

  // Handle status
  if (filter.status && filter.status !== "All") {
    params.filter.status = filter.status;
  }

  // Handle alpha
  if (filter.alpha) {
    params.filter.name = "^" + filter.alpha;
  }

  // Global sort (optional) - accepts seller catalog global sort keys
  if ((filter as any)?.globalSort && (filter as any).globalSort !== "all") {
    params.sort = (filter as any).globalSort;
  }

  return params;
};

export const getData = async (
  params: Record<string, any>,
  ignoreCaseStock?: boolean,
  excludeReserveStock?: boolean,
): Promise<SellerDeal[]> => {
  try {
    const response = await SellerCatalogService.getProducts(params);

    if (response.statusCode === 200 && Array.isArray(response.data?.data)) {
      const products = SellerCatalogService.formatProductResponse(
        response.data?.data || [],
        {
          ignoreCaseStock: ignoreCaseStock,
          view: "buyer",
          excludeReserveStock,
        },
      );

      // If b2bScheme is enabled, ignore price slabs
      products.forEach((p: any) => {
        if (p.b2bScheme?.isOfferOfTheDay) {
          p.priceSlabs = [];
          p.priceSlabType = "";
        }
      });

      try {
        const tmpItems = CartService.tmpCartData?.items || [];
        if (Array.isArray(tmpItems) && tmpItems.length > 0) {
          const normalized = tmpItems.map((it: any) => {
            return {
              id: it.deal?.id,
              qty: it.quantity || 0,
            };
          });

          // Create a map for quick lookup
          const map = new Map<string, number>();
          normalized.forEach((n: any) => {
            if (!n.id) return;
            const existing = map.get(String(n.id)) || 0;
            map.set(String(n.id), existing + (Number(n.qty) || 0));
          });

          // Apply reduction to products' maxQty and update inCart for each product
          products.forEach((p: PosBillingDeal) => {
            const key = String(p._id);
            const used = map.get(key) || 0;
            if (used > 0) {
              p.origMaxQty = p.maxQty || 0;
              p.maxQty = Math.max(0, (p.origMaxQty || 0) - used);
              p.inCart = {
                status: true,
                qty: used,
              };
            }
          });
        }
      } catch (e) {
        // Swallow failures in cart merging to avoid breaking product listing
        console.warn("Failed to adjust product stock from tmp cart:", e);
      }

      return products;
    }
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const countParams: Record<string, any> = { ...params, outputType: "count" };
    delete countParams.page;
    delete countParams.count;
    delete countParams.sort;
    const response = await SellerCatalogService.getProducts(countParams);
    if (response.statusCode === 200 && response.data?.count) {
      return response.data?.count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching products count:", error);
    return 0;
  }
};
