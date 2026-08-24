import axios from "axios";
import { tintIndexFor } from "~/components/core/tint/tints";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export interface FilterFormFields {
  search: string;
  keys?: string[];
  menu: any[];
  categories: any[];
  brands: any[];
  companyName?: Array<{ label: string; value: any }>;
  searchType: string;
  activeTab: string;
  sortType: string;
  radiusKms: number | null;
  onlyOffers?: boolean;
  isGroupDeal?: boolean;
  alpha?: string;
  primeCatalog?: boolean;
  primeCatalogTop?: number;
  productsWithImages?: boolean;
  productsWithoutImages?: boolean;
  onlyNotSubscribed?: boolean;
}

export const defaultFilterValues: FilterFormFields = {
  search: "",
  menu: [],
  categories: [],
  brands: [],
  companyName: [],
  searchType: "Products",
  activeTab: "",
  sortType: "popular",
  radiusKms: 10,
  onlyOffers: false,
  isGroupDeal: false,
  primeCatalog: false,
  primeCatalogTop: 200,
  productsWithImages: false,
  productsWithoutImages: false,
  onlyNotSubscribed: false,
};

export const EXTRA_SORT_TYPES = [
  {
    label: "MRP Low to High",
    value: "mrp-low-to-high",
  },
  {
    label: "MRP High to Low",
    value: "mrp-high-to-low",
  },
];

export const RADIUS_KMS = [
  {
    label: "5 km",
    value: 5,
  },
  {
    label: "10 km",
    value: 10,
  },
  {
    label: "20 km",
    value: 20,
  },
  {
    label: "30 km",
    value: 30,
  },
  {
    label: "40 km",
    value: 40,
  },
];

const attachBusinessLinkedMenus = async (params: Record<string, any>) => {
  if (!params.primeCatalog) {
    const p = { ...params };
    delete p.primeCatalog;
    return p;
  }
  const primaryId = AuthService.getLoggedInUserPrimaryBusiness()?.id;
  const secondaryId = AuthService.getLoggedInUserSecondaryBusiness()?.id;
  const businessCategories = await SellerCatalogService.getBusinessLinkedMenus(
    primaryId,
    secondaryId,
  );

  if (
    businessCategories.status === "success" &&
    businessCategories.ids.length > 0
  ) {
    if (!params.filter) {
      params.filter = {};
    }
    params.filter["applicableMenu.id"] = { $in: businessCategories.ids };
  }

  const p = {
    ...params,
  };
  delete p.primeCatalog;

  return p;
};

/** Radius used by the "top" tab when it carries no explicit `radiusKms`. */
export const TOP_PICKS_DEFAULT_RADIUS_KM = 5;

const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * The deal's ObjectId, which is what subscribe/cart calls key on.
 *
 * The price-comparison rows name it inconsistently across deal sources —
 * sometimes `dealId`, sometimes `dealRefId`, with the other holding the
 * human-readable reference — so pick whichever value actually looks like an
 * ObjectId rather than trusting either key.
 */
export const resolveDealObjectId = (deal: any): string => {
  const candidates = [deal?.dealId, deal?.dealRefId, deal?._id];
  return (
    candidates.find(
      (value) => typeof value === "string" && OBJECT_ID.test(value),
    ) ||
    candidates.find(Boolean) ||
    ""
  );
};

/**
 * A "Popular near me" card row.
 *
 * Keeps the same key names the subscribe search list already uses
 * (`_id`, `isInCart`, `itemId`, …) so the page's subscribe / remove / bulk
 * select handlers work on these rows unchanged; `sellersCount` and `radiusKm`
 * are the only additions the card needs.
 */
export interface TopPickDeal {
  _id: string;
  dealId: string;
  dealRefId: string;
  name: string;
  images: string[];
  brand: { id: string; name: string };
  category: { id: string; name: string };
  companyName: string;
  mrp: number;
  price: number;
  barcodes: string[];
  hsn: string;
  gst: number;
  isSubscribed: boolean;
  isInCart: boolean;
  itemId: string;
  cartQuantity: number;
  /** Sellers within {@link radiusKm} who already stock this SKU. */
  sellersCount: number;
  radiusKm: number;
  /** Up to three letters shown when the deal carries no image. */
  initials: string;
  /** Tint slot for the plate behind the image, stable per deal name. */
  tintIndex: number;
}

const formatTopPickResponse = (data: any[], radiusKm: number): TopPickDeal[] =>
  (data || []).map((deal: any) => {
    const dealObjectId = resolveDealObjectId(deal);
    const localCartItem =
      InventorySubscribeService.getLocalCartItem(dealObjectId);
    const name = deal.dealName || deal.name || "";

    return {
      _id: dealObjectId,
      dealId: deal.dealId || "",
      dealRefId: deal.dealRefId || deal.dealId || "",
      name,
      images: deal.images || [],
      brand: {
        id: deal.applicableBrand?.brandId || "",
        name: deal.applicableBrand?.brandName || "",
      },
      category: {
        id: deal.applicableCategory?.categoryId || "",
        name: deal.applicableCategory?.categoryName || "",
      },
      companyName: deal.companyName || "",
      mrp: deal.mrp || 0,
      price: deal.bestPrice || deal.b2bPrice || deal.mrp || 0,
      barcodes: deal.barcodes || (deal.barcode ? [deal.barcode] : []),
      hsn: deal.hsn || "",
      gst: deal.tax || 0,
      isSubscribed: !!deal.isSubscribed,
      isInCart: !!localCartItem?.dealId,
      itemId: localCartItem?.itemId || "",
      cartQuantity: localCartItem?.quantity || 0,
      sellersCount: Number(deal.sellersCount) || 0,
      radiusKm,
      initials: name.trim().slice(0, 3).toUpperCase(),
      tintIndex: tintIndexFor(name || dealObjectId),
    };
  });

/**
 * Params for the price-comparison call behind the "top" tab.
 *
 * Reuses the mongo `filter` {@link prepareParams} already built (brand /
 * category / menu / barcode) but drops the deal-listing-only keys, since this
 * runs against `catalog/seller-deals/price-comparison` rather than the deals
 * endpoint. `isSubscribed: false` keeps the tab to SKUs this seller can still
 * adopt, and `distance` bounds the seller radius the counts are drawn from.
 */
const prepareTopPicksParams = (
  filterParams: Record<string, any>,
  pagination: PaginationState,
  baseParams: Record<string, any>,
) => {
  const params: Record<string, any> = {
    view: "network",
    outputType: "list",
    distance: filterParams.radiusKms || TOP_PICKS_DEFAULT_RADIUS_KM,
    isSubscribed: false,
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
  };

  if (baseParams.search) params.search = baseParams.search;

  if (baseParams.filter) {
    // `topRunningDeal` is a deals-endpoint flag; the price comparison already
    // scopes to what peers in the radius are running, so passing it through
    // would just filter on a field this endpoint doesn't know.
    const { topRunningDeal, name, ...filter } = baseParams.filter;
    // The alpha filter targets the product name, which this endpoint exposes as
    // `dealName` — passing `name` through would filter on a field it doesn't know.
    if (name !== undefined) filter.dealName = name;
    if (Object.keys(filter).length) params.filter = filter;
  }

  return params;
};

/** Whether {@link prepareParams} built params for the price-comparison call. */
const isTopPicksParams = (params: Record<string, any>) =>
  params?.view === "network";

const isAbortError = (error: any) =>
  axios.isCancel(error) ||
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

/**
 * Rows for the list.
 *
 * The "top" tab runs on the network price comparison instead of the deal list,
 * so its cards can report how many shops around here stock the SKU. That
 * endpoint carries the row count on the same response (`pagination.total`), so
 * it comes back as `total` here and {@link getCount} stays out of the way — a
 * second call would cost a request and report a different generation than the
 * rows on screen.
 */
export const getData = async (
  params: Record<string, any>,
  signal?: AbortSignal,
): Promise<{ data: any[]; total?: number }> => {
  if (isTopPicksParams(params)) {
    const response = await SellerCatalogService.getPriceComparison(
      params,
      signal ? { signal } : undefined,
    );
    const body: any = response?.data || {};

    return {
      data: formatTopPickResponse(body.data || [], params.distance),
      total: Number(body.pagination?.total) || 0,
    };
  }

  try {
    const p = await attachBusinessLinkedMenus(params);
    const response = await InventorySubscribeService.getDeals(p, { signal });

    let d = response?.data?.data || [];

    if (!d?.length) {
      let p2 = { ...p };
      delete p2.dealSubscribeType;
      const response = await InventorySubscribeService.getDeals(p2, { signal });
      d = response?.data?.data || [];
    }

    return {
      data: InventorySubscribeService.formatDealResponse(d),
    };
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (
  params: Record<string, any>,
  signal?: AbortSignal,
) => {
  // The price comparison sends its total alongside the rows — see getData.
  if (isTopPicksParams(params)) return 0;

  const p = await attachBusinessLinkedMenus(params);

  delete p.page;
  delete p.limit;

  try {
    const response = await InventorySubscribeService.getDealsCount(p, {
      signal,
    });
    let count = response?.data?.data?.totalDeals || 0;
    if (!count) {
      let p2 = { ...p };
      delete p2.dealSubscribeType;
      const response = await InventorySubscribeService.getDealsCount(p2, {
        signal,
      });
      count = response?.data?.data?.totalDeals || 0;
    }
    return count;
  } catch (error) {
    if (isAbortError(error)) throw error;
    return 0;
  }
};

export const prepareParams = (
  filterParams: Record<string, any>,
  pagination: PaginationState,
  sort?: SortProps,
) => {
  const filter = { ...filterParams };
  // Same deal filter the browse grids count with, so their tile counts and this
  // list agree — see `InventorySubscribeService.getSubscribableDealParams`.
  let p: Record<string, any> = {
    ...InventorySubscribeService.getSubscribableDealParams(),
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
  };

  if (filter.activeTab === "top") {
    p.filter.topRunningDeal = true;
  }

  if (filter.menu?.length > 0) {
    const menuIds = filter.menu
      .filter((m: any) => m?.value?.id)
      .map((m: any) => m.value.id);

    if (menuIds.length > 0) {
      p.filter["applicableMenu.menuId"] = { $in: [...new Set(menuIds)] };
    }
  }

  // Collect category IDs
  const categoryIds: string[] = [];

  if (filter.categories?.length > 0) {
    const modalCategoryIds = filter.categories
      .filter((c: any) => c?.value?.id)
      .map((c: any) => c.value.id);
    categoryIds.push(...modalCategoryIds);
  }

  if (categoryIds.length > 0) {
    p.filter["applicableCategory.categoryId"] = {
      $in: [...new Set(categoryIds)],
    };
  }

  // Collect brand IDs
  if (filter.brands?.length > 0) {
    const brandIds = filter.brands
      .filter((b: any) => b?.value?.id)
      .map((b: any) => b.value?.id);

    if (brandIds.length > 0) {
      p.filter["applicableBrand.brandId"] = { $in: [...new Set(brandIds)] };
    }
  }

  // Handle companyName filter (single selection expected)
  if (
    filter.companyName &&
    Array.isArray(filter.companyName) &&
    filter.companyName.length > 0
  ) {
    const c = filter.companyName[0];
    if (c?.label) {
      p.filter.companyName = c.label;
    }
  }

  // Handle search filter
  if (filter.search) {
    const search = filter.search.trim();
    if (search) {
      if (filter.searchType === "barcode") {
        p.filter.barcodes = { $regex: search, $options: "i" };
      } else {
        p.search = search;
        // p.filter.$or = [
        //   {
        //     name: {
        //       $regex: search,
        //       $options: "i",
        //     },
        //   },
        //   {
        //     dealId: search,
        //   },
        //   {
        //     keywords: {
        //       $regex: search,
        //       $options: "i",
        //     },
        //   },
        // ];
      }
    }
  }

  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  if (filter.sortType) {
    if (filter.activeTab === "search") {
      delete filter.radiusKm;
    }
    const sortParams = InventorySubscribeService.getSortParams(
      "product",
      filter.sortType,
    );
    p.sort = sortParams?.sort || {};
  }

  if (filter.radiusKms && filter.activeTab === "top") {
    p.sort = {
      sortType: "popular-near-me",
      radiusKm: filter.radiusKms,
    };
  }

  // A column header sort (from the desktop table) takes precedence over the
  // sortType dropdown: the header `key` is the backend deal field to sort on.
  if (sort && sort.key) {
    p.sort = {
      [sort.key]: sort.value === "asc" ? 1 : -1,
    };
  }

  if (typeof filter.onlyOffers === "boolean" && filter.onlyOffers) {
    p.filter.isConsumerOffer = true;
  }

  // If user wants only grouped deals, add filter flag
  if (typeof filter.isGroupDeal === "boolean" && filter.isGroupDeal) {
    p.filter.isGroupDeal = true;
  }

  if (filter.alpha) {
    p.filter["name"] = CommonService.prepareAlphaRegexFilter(filter.alpha);
  }

  if (filter.productsWithImages) {
    p.filter.$expr = { $gt: [{ $size: "$images" }, 0] };
  }

  if (filter.productsWithoutImages) {
    p.filter.$expr = { $lt: [{ $size: "$images" }, 1] };
  }

  // if (filter.onlyNotSubscribed) {
  //   p.dealSubscribeType = "NOTSUBSCRIBED";
  // }

  p.primeCatalog = filter.primeCatalog;

  // The "top" tab is served by the price comparison, so hand back that call's
  // params instead of the deal-listing ones.
  if (filter.activeTab === "top") {
    return prepareTopPicksParams(filter, pagination, p);
  }

  return p;
};
