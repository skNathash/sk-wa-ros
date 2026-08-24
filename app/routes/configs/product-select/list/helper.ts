import { merge } from "lodash";
import CommonService from "~/services/CommonService";
import InventoryDealFilterService from "~/services/InventoryDealFilterService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type {
  BreadcrumbItem,
  PaginationState,
  SellerDeal,
} from "~/types/CommonTypes";

export type ProductItemType = SellerDeal & {
  isInCart?: boolean;
  isLoading: boolean;
  itemId?: string;
};

export const defaultFormFilter: Record<string, any> = {
  search: "",
  menu: [],
  category: [],
  brand: [],
  alpha: "",
  companyName: [],
  status: "All",
  velocity: "All",
  stockStatus: "All",
  onlyOffers: false,
  withoutStock: false,
  isGroupDeal: false,
  isPriceSlab: false,
  keys: [],
  globalSort: "recently-subscribed",
};

export const getData = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getProducts(params);
  const d = Array.isArray(response.data.data) ? response.data.data : [];
  return SellerCatalogService.formatProductResponse(d, {
    includeRawResponse: true,
  });
};

export const getCount = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getProducts({
    ...params,
    outputType: "count",
  });
  return response?.data?.count || 0;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  let p: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      status: "Active",
    },
  };

  // Send networkPriceConfig=NoOffer only when the "not configured" checkbox is checked
  if (filter?.feature === "PriceUpdate" && filter?.notConfiguredOnly) {
    p.networkPriceConfig = "NoOffer";
  }

  // Filter to show only products missing configuration
  if (filter?.notConfiguredOnly) {
    if (filter.feature === "PackUpdate") {
      p.filter.isPackageTypeUpdated = false;
    } else if (filter.feature === "PriceUpdate") {
      p.filter.isPriceUpdated = false;
    }
  }

  const search = filter.search?.trim();
  if (search) {
    p.filter.search = search;
  }

  const alpha = filter.alpha || "";

  if (alpha) {
    p.filter.dealName = CommonService.prepareAlphaRegexFilter(alpha);
  }

  const preparedFilter =
    InventoryDealFilterService.prepareDealInventoryFilterParams(filter);

  // Normalize brand and category filters so API receives
  // `applicableBrand.brandId` and `applicableCategory.categoryId` properly.
  const normalizeIds = (arr: any[]) =>
    arr.map((it: any) => it.value.id).filter(Boolean);

  if (Array.isArray(filter?.brand) && filter.brand.length > 0) {
    const brandIds = normalizeIds(filter.brand);
    if (!preparedFilter.filter) preparedFilter.filter = {};
    preparedFilter.filter["applicableBrand.brandId"] =
      brandIds.length === 1 ? brandIds[0] : { $in: brandIds };
  }

  if (Array.isArray(filter?.category) && filter.category.length > 0) {
    const categoryIds = normalizeIds(filter.category);
    if (!preparedFilter.filter) preparedFilter.filter = {};
    preparedFilter.filter["applicableCategory.categoryId"] =
      categoryIds.length === 1 ? categoryIds[0] : { $in: categoryIds };
  }

  return merge(p, preparedFilter);
};

export const getTitle = (feature: string) => {
  if (feature === "PriceUpdate") return "Create B2B Schemes";
  if (feature === "PackUpdate") return "Sell By";
  if (feature === "ReserveConfig") return "Configure Stock Reservation";
  if (feature === "PromotionDealUpdate") return "Configure Promotional Deals";
  return "Product Select";
};

export const mapCartDeals = (cartDeals: any[], deals: any[]) => {
  return deals.map((deal) => {
    const cartDeal = cartDeals.find((cd) => cd.dealId === deal._id);
    return {
      ...deal,
      isInCart: !!cartDeal,
      itemId: cartDeal?._id,
    };
  });
};

export const getBreadcrumbItems = (
  feature: string,
  source?: string,
): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
  ];

  // Resolve middle breadcrumb from shared SellerCatalogService helper first
  const sourceCrumb = SellerCatalogService.getInventorySourceBreadcrumb(source);

  if (sourceCrumb) {
    items.push(sourceCrumb);
  } else if (!source && feature === "PriceUpdate") {
    // Backwards compatibility: direct PriceUpdate entry from schemes list
    items.push({
      label: "B2B Schemes",
      redirect: { path: "/configs/schemes" },
    });
  } else if (
    ["PackUpdate", "ReserveConfig", "PromotionDealUpdate"].includes(feature)
  ) {
    items.push({
      label: "Bulk Update",
      redirect: { path: "/dashboard/inventory/bulk-update" },
    });
  } else {
    items.push({
      label: "Product Select",
      redirect: { path: "/configs/product-select" },
    });
  }

  items.push({ label: getTitle(feature) });

  return items;
};
