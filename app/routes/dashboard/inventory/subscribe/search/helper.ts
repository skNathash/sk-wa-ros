import axios from "axios";
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

const isAbortError = (error: any) =>
  axios.isCancel(error) ||
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

export const getData = async (
  params: Record<string, any>,
  signal?: AbortSignal,
) => {
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
  let p: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      status: "Active",
      "applicableBrand.brandName": {
        $ne: "",
      },
      isLocalDeal: false,
      // isSubscribed: false,
    },
    dealSubscribeType: "NOTSUBSCRIBED",
    groupGroupedDeals: true,
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

  return p;
};
