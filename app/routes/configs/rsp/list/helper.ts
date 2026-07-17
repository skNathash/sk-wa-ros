import SellerCatalogService from "~/services/SellerCatalogService";
import CommonService from "~/services/CommonService";
import type {
  AppliedFilterLabel,
  BreadcrumbItem,
  PaginationState,
  SortProps,
} from "~/types/CommonTypes";

export interface FilterFormFields {
  dateRange: any[];
  status: string;
  search: string;
  alpha: string;
  menu: any[];
  category: any[];
  brand: any[];
  companyName?: any[];
  priceMode: string;
  type: string;
  velocity: string;
  stockStatus: string;
  withoutStock: boolean;
  onlyOffers: boolean;
  keys: string[];
  isFixedPrice: boolean;
  isPriceSlab: boolean;
  globalSort: string;
}

export const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 50,
  startSlNo: 1,
  endSlNo: 50,
  totalRecords: 0,
};

export const defaultBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Manage Price",
  },
  {
    label: "B2C Selling Price",
  },
];

export const defaultSummary = [
  {
    label: "Total Configs",
    value: 0,
    apiFilter: {},
    loading: false,
    icon: "indian-rupee",
  },
  {
    label: "Active Configs",
    value: 0,
    apiFilter: {
      filter: {
        status: "Active",
      },
    },
    loading: false,
    icon: "check-circle",
  },
  {
    label: "Inactive Configs",
    value: 0,
    apiFilter: {
      filter: {
        status: "Inactive",
      },
    },
    loading: false,
    icon: "x-circle",
  },
];

export const filterLabels: Record<string, AppliedFilterLabel> = {
  status: {
    label: "Status",
    resetValue: "",
    ignoreValue: "All",
  },
  velocity: {
    label: "Velocity",
    resetValue: "",
    ignoreValue: "All",
  },
  stockStatus: {
    label: "Stock Status",
    resetValue: "",
    ignoreValue: "All",
  },
  dateRange: {
    label: "Date Range",
    type: "dateRange",
    resetValue: [],
  },
  menu: {
    label: "Menu",
    resetValue: [],
    value: {
      isMulti: true,
      path: "value.name",
    },
  },
  brand: {
    label: "Brands",
    resetValue: [],
    value: {
      isMulti: true,
      path: "value.name",
    },
  },
  category: {
    label: "Categories",
    resetValue: [],
    value: {
      isMulti: true,
      path: "value.name",
    },
  },
  companyName: {
    label: "Company Name",
    resetValue: [],
    value: {
      isMulti: true,
      path: "value.name",
    },
  },
  isFixedPrice: {
    label: "Fixed Price",
    resetValue: false,
    ignoreValue: false,
  },
  isPriceSlab: {
    label: "Price Slab",
    resetValue: false,
    ignoreValue: false,
  },
};

export const prepareFilters = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps | undefined,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  const type = (filters.type || "").toString();

  // Handle global sort
  if (filters.globalSort && filters.globalSort !== "all") {
    if (
      filters.globalSort === "price-desc" ||
      filters.globalSort === "price-asc"
    ) {
      const isB2B = type === "network" || type === "b2b";
      const field = isB2B
        ? "networkSellingPrice.discount"
        : "customerSellingPrice.discount";
      params.sort = { [field]: filters.globalSort === "price-desc" ? -1 : 1 };
    } else {
      params.sort = filters.globalSort;
    }
  } else {
    params.sort = { name: 1 }; // Default sort
  }

  // Handle search
  if (filters.search?.trim()) {
    params.filter.search = filters.search;
  }

  // Handle alpha filter (by name)
  if (filters.alpha) {
    params.filter.dealName = CommonService.prepareAlphaRegexFilter(
      filters.alpha,
    );
  }

  if (filters.menu?.length > 0) {
    params.filter["applicableMenu.menuId"] = {
      $in: filters.menu.map((item: any) => item?.value?.id),
    };
  }

  if (filters.category?.length > 0) {
    params.filter["applicableCategory.categoryId"] = {
      $in: filters.category.map((item: any) => item?.value?.id),
    };
  }

  if (filters.brand?.length > 0) {
    params.filter["applicableBrand.brandId"] = {
      $in: filters.brand.map((item: any) => item?.value?.id),
    };
  }

  if (filters.status && filters.status !== "All") {
    params.filter.status = filters.status;
  }

  if (filters.velocity && filters.velocity !== "All") {
    if (filters.velocity === "consumerOffer") {
      params.filter.isConsumerOffer = true;
    } else if (filters.velocity === "outOfStock") {
      params.filter.quantity = { $lte: 0 };
    } else if (filters.velocity === "subscribedByCustomer") {
      params.filter["subscribedBy.type"] = "Customer";
    } else {
      params.filter.movementTypeFilter = filters.velocity;
    }
  }

  if (filters.stockStatus && filters.stockStatus !== "All") {
    if (filters.stockStatus === "Out of Stock") {
      params.filter.quantity = { $lte: 0 };
    } else {
      params.filter.stockStatusFilter = filters.stockStatus;
    }
  }

  // Toggle stock availability
  if (typeof filters.withoutStock === "boolean" && filters.withoutStock) {
    // Only show products without stock (quantity <= 0)
    params.filter.quantity = { $lte: 0 };
  }

  // If voice/keyword tokens were collected, serialize them to a comma-separated `keys` param
  if (filters.keys && Array.isArray(filters.keys) && filters.keys.length) {
    params.keys = filters.keys.join(",");
  }

  if (typeof filters.onlyOffers === "boolean" && filters.onlyOffers) {
    params.filter.isConsumerOffer = true;
  }

  if (typeof filters.isPriceSlab === "boolean" && filters.isPriceSlab) {
    if (type === "network") {
      params.filter["networkPriceSlab"] = { $exists: true, $ne: null };
    } else {
      params.filter["customerPriceSlab"] = { $exists: true, $ne: null };
    }
  }

  // Handle price mode filter: map to discountType for customer/network
  // if (filters.priceMode) {
  //   const mode = (filters.priceMode || "").toString();
  //   if (mode === "all") {
  //     // 'All' means don't apply any price mode filtering
  //     return params;
  //   }
  //   const type = (filters.type || "").toString();
  //   const field =
  //     type === "network" || type === "b2b"
  //       ? "networkSellingPrice.discountType"
  //       : "customerSellingPrice.discountType";

  //   if (mode === "fixed") {
  //     params.filter[field] = "Fixed";
  //   } else {
  //     // for on_mrp / on_purchase, show non-fixed discount types
  //     params.filter[field] = { $ne: "Fixed" };
  //   }
  // }

  // Handle isFixedPrice filter
  if (typeof filters.isFixedPrice === "boolean" && filters.isFixedPrice) {
    const type = (filters.type || "").toString();
    const field =
      type === "network" || type === "b2b"
        ? "networkSellingPrice.discountType"
        : "customerSellingPrice.discountType";
    params.filter[field] = "Fixed";
  }

  // Handle companyName filter (single selection stored as array of {label, value})
  if (
    Array.isArray(filters.companyName) &&
    filters.companyName.length > 0 &&
    filters.companyName[0]?.label
  ) {
    params.filter.companyName = filters.companyName[0].label;
  }

  return params;
};

export const getData = async (
  params: Record<string, any>,
  type?: "network" | "customer",
) => {
  const response = await SellerCatalogService.getProducts(params);
  const formatted = SellerCatalogService.formatProductResponse(
    response.data?.data || [],
  );

  // Attach a convenience key _discountType on each item so views can read it directly.
  return formatted.map((item: any) => {
    let priceSlab = {};

    let discountType = "";

    if (type === "network") {
      discountType = item.b2bDiscountType;
    } else {
      discountType = item.b2cDiscountType;
    }

    if (type === "network" && item.networkPriceSlab?.isAvailable) {
      priceSlab = item.networkPriceSlab;
    }

    if (type === "customer" && item.customerPriceSlab?.isAvailable) {
      priceSlab = item.customerPriceSlab;
    }

    return {
      ...item,
      _discountType: discountType,
      _priceSlab: priceSlab,
    };
  });
};

export const getCount = async (params: Record<string, any>) => {
  const p: Record<string, any> = { ...params, outputType: "count" };

  delete p.page;
  delete p.limit;
  delete p.sort;

  const response = await SellerCatalogService.getProducts(p);

  return response.data?.count || 0;
};
