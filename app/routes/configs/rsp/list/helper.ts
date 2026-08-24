import SellerCatalogService from "~/services/SellerCatalogService";
import CommonService from "~/services/CommonService";
import AuthService from "~/services/AuthService";
import SellerGroupPriceConfigService from "~/services/SellerGroupPriceConfigService";
import { GROUP_TYPE } from "~/shared/catalog/modals/price-group-config/helper";
import type { PriceComparisonSummary } from "./insights";
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
  pricingFilter: "all" | "unpriced" | "low-margin" | "out-of-stock" | "new";
  /**
   * Online-match narrowing (electronics): `above` = priced above the cheapest
   * online listing, `winning` = at or under it. Served by the price-comparison
   * endpoint's root `type`, so it filters the whole result set — see
   * {@link MATCH_API_TYPE}.
   */
  match?: "all" | "above" | "winning";
}

/**
 * Root-level `type` the price-comparison endpoint filters deals by for each
 * online-match state. `all` carries no type — the endpoint returns everything.
 */
export const MATCH_API_TYPE: Record<string, string | undefined> = {
  all: undefined,
  above: "aboveOnlinePrice",
  winning: "belowOnlinePrice",
};

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
    // Purchase price / MRP sort straight on the document fields — the API has
    // no keyword for them, so the sort object is sent as-is.
    const FIELD_SORT: Record<string, Record<string, 1 | -1>> = {
      "purchase-price-asc": { "purchaseInfo.price": 1 },
      "purchase-price-desc": { "purchaseInfo.price": -1 },
      "mrp-asc": { mrp: 1 },
      "mrp-desc": { mrp: -1 },
    };

    if (FIELD_SORT[filters.globalSort]) {
      params.sort = FIELD_SORT[filters.globalSort];
    } else if (
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

  // Online-match narrowing — a root-level `type` on the price-comparison
  // endpoint, so "above online" / "winning" narrow the whole result set (and
  // its count) rather than just the rows already loaded.
  const matchType = MATCH_API_TYPE[filters.match];
  if (matchType) {
    params.type = matchType;
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

  // Mobile pricing quick-filter strip: All / Unpriced / Low margin / Out of stock / New.
  // "low-margin" is now served by the API's root `type` filter (lowMargin),
  // so it narrows the whole result set rather than only the loaded page.
  if (filters.pricingFilter && filters.pricingFilter !== "all") {
    if (filters.pricingFilter === "low-margin") {
      params.type = "lowMargin";
    }

    if (filters.pricingFilter === "unpriced") {
      // "Unpriced" on the server is `defaultToMrp` — deals with no selling
      // price of their own, which the endpoint reports at MRP. The channel it
      // is judged on comes from `priceType` (b2b / b2c), set alongside this by
      // {@link preparePriceComparisonParams}, so the same root `type` serves
      // both sheets — and the electronics view, which adds `onlinePriceExist`.
      params.type = "defaultToMrp";
    }

    if (filters.pricingFilter === "out-of-stock") {
      params.filter.quantity = { $lte: 0 };
    }

    if (filters.pricingFilter === "new") {
      // "New" = products created in the last 7 days.
      const since = new Date();
      since.setDate(since.getDate() - 7);
      since.setHours(0, 0, 0, 0);
      params.filter.createdAt = { $gte: since.toISOString() };
    }
  }

  return params;
};

/** Peer radius (km) the comparison figures are computed against. */
export const PRICE_COMPARISON_DISTANCE = 15;

/**
 * The list runs on `catalog/seller-deals/price-comparison`, which takes the
 * standard seller-deal params (page / limit / filter / sort) built by
 * {@link prepareFilters} plus the comparison context: the seller radius and the
 * channel being priced. `outputType` picks rows vs the aggregate block.
 */
export const preparePriceComparisonParams = (
  params: Record<string, any>,
  type?: "network" | "customer",
) => ({
  distance: PRICE_COMPARISON_DISTANCE,
  priceType: type === "network" ? "b2b" : "b2c",
  ...params,
});

/**
 * Where the network average sits between this seller's own selling price and
 * the MRP — the numbers behind the peer column's range bar. Everything is
 * display-ready (percentages already rounded, marker offsets already 0–100) so
 * the cell renders plain fields.
 */
export interface PeerRange {
  /** False when there is no usable price → MRP span — the cell renders a dash. */
  hasRange: boolean;
  /** Band start — the lowest of own price / peer average / MRP. */
  min: number;
  /** Band end — the highest of own price / peer average / MRP. */
  max: number;
  avg: number;
  price: number;
  /** Own price as a 0–100 offset inside the band. */
  pricePos: number;
  /** Network average as a 0–100 offset inside the band. */
  avgPos: number;
  /** Whether the seller sells above / below the network average. */
  direction: "above" | "below" | "same";
  /** "▲ 2% vs sellers" — arrow included. */
  label: string;
  /** "Your ₹172 · sellers avg ₹173 · MRP ₹180" — the cell's hover title. */
  title: string;
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Builds {@link PeerRange} from a raw price-comparison row. The band spans the
 * three prices on screen — own selling price, the channel-scoped network
 * average (`avgNetworkB2bPrice` / `avgNetworkB2cPrice`) and MRP — so it always
 * starts at the lowest of them and ends at the highest, and each marker sits at
 * its real position rather than the seller being pinned to the start.
 */
export const buildPeerRange = (
  raw: Record<string, any>,
  price: number,
  mrp: number,
  type?: "network" | "customer",
): PeerRange => {
  const isB2B = type === "network";

  const own = Number(price) || 0;
  const mrpValue = Number(mrp) || 0;
  const avg = Number(
    (isB2B ? raw?.avgNetworkB2bPrice : raw?.avgNetworkB2cPrice) || 0,
  );

  // Band bounds come from whichever prices we actually have, so the lower end
  // is always the smallest figure — the peer average can undercut own price.
  const points = [own, mrpValue, avg].filter((value) => value > 0);
  const min = points.length ? Math.min(...points) : 0;
  const max = points.length ? Math.max(...points) : 0;

  const span = max - min;
  const positionOf = (value: number) =>
    span > 0 ? clampPercent(((value - min) / span) * 100) : 50;
  const pricePos = positionOf(own);
  const avgPos = positionOf(avg);

  const diff = avg > 0 ? ((price - avg) / avg) * 100 : 0;
  const direction = diff > 0 ? "above" : diff < 0 ? "below" : "same";
  const arrow = direction === "above" ? "▲" : direction === "below" ? "▼" : "•";

  const money = (value: number) =>
    `₹${CommonService.formattedAmount(value, 2)}`;

  return {
    hasRange: own > 0 && max > min,
    min,
    max,
    avg,
    price,
    pricePos,
    avgPos,
    direction,
    label: avg > 0 ? `${arrow} ${Math.abs(Math.round(diff))}% vs sellers` : "",
    title: [
      `Your ${money(price)}`,
      avg > 0 ? `sellers avg ${money(avg)}` : "",
      `MRP ${money(mrpValue)}`,
    ]
      .filter(Boolean)
      .join(" · "),
  };
};

/**
 * Re-derives the keys the views print off the row's own price/discount —
 * discount type, margin label and tone, peer range. Written in place so it can
 * run on a fetched row as well as on an immer draft after a price/discount
 * write, keeping the row in step with what was just saved instead of waiting
 * for a reload.
 */
export const applyRowDecor = (row: any, type?: "network" | "customer") => {
  const isNetwork = type === "network";
  const marginPct = (isNetwork ? row.b2bDiscount : row.b2cDiscount) || 0;

  row._discountType =
    (isNetwork ? row.b2bDiscountType : row.b2cDiscountType) || "";
  row._marginLabel = `${CommonService.roundedByDecimalPlace(marginPct, 2)}%`;
  row._marginTone = marginPct >= 20 ? "high" : marginPct >= 10 ? "mid" : "low";
  row._peer = buildPeerRange(
    row._raw || {},
    (isNetwork ? row.b2bPrice : row.b2cPrice) || 0,
    row.mrp || 0,
    type,
  );

  return row;
};

export const getData = async (
  params: Record<string, any>,
  type?: "network" | "customer",
) => {
  const response = await SellerCatalogService.getPriceComparison({
    ...preparePriceComparisonParams(params, type),
    outputType: "list",
  });
  const formatted = SellerCatalogService.formatProductResponse(
    response.data?.data || [],
  );

  // Attach the convenience keys (_discountType, margin, peer range) the views
  // read directly, so a row carries its own display state.
  return formatted.map((item: any) => {
    let priceSlab = {};

    if (type === "network" && item.networkPriceSlab?.isAvailable) {
      priceSlab = item.networkPriceSlab;
    }

    if (type === "customer" && item.customerPriceSlab?.isAvailable) {
      priceSlab = item.customerPriceSlab;
    }

    return applyRowDecor({ ...item, _priceSlab: priceSlab }, type);
  });
};

/**
 * Catalogue-wide margin summary for the Manage Price cards.
 *
 * `outputType=summary` is what turns the price-comparison endpoint into the
 * aggregate block (totalDeals / avgMargin / avgMarginLastWeek / bucket
 * counts); `page` and `limit` are still required by the endpoint even though
 * no rows come back. Returns null when the API has nothing usable, so the
 * caller can keep the page-derived figures.
 */
export const getPriceComparisonSummary = async (
  params: Record<string, any> = {},
): Promise<PriceComparisonSummary | null> => {
  const response = await SellerCatalogService.getPriceComparison({
    distance: 1000,
    page: 1,
    limit: 10,
    ...params,
    outputType: "summary",
  });

  const payload = response?.data?.data ?? response?.data;
  const summary = Array.isArray(payload) ? payload[0] : payload;
  if (!summary || typeof summary.totalDeals !== "number") return null;

  return {
    totalDeals: summary.totalDeals || 0,
    avgMargin: summary.avgMargin || 0,
    avgMarginLastWeek: summary.avgMarginLastWeek || 0,
    highMargin: summary.highMargin || 0,
    midMargin: summary.midMargin || 0,
    lowMargin: summary.lowMargin || 0,
  };
};

/**
 * Normalised `outputType=priceSummary` block — the four numbers behind the
 * Manage Price stat strip, already shaped for display so the cards render
 * plain fields.
 */
export interface PriceSummary {
  pricedCount: number;
  totalCount: number;
  avgMarginLabel: string;
  lowMarginCount: number;
}

/**
 * Filter-aware pricing summary. Takes the same params as {@link getData} — the
 * strip reports on exactly the slice the sheet is listing — and returns null
 * when the API has nothing usable so the cards can hold their last value.
 */
export const getSummary = async (
  params: Record<string, any>,
  type?: "network" | "customer",
): Promise<PriceSummary | null> => {
  const response = await SellerCatalogService.getPriceComparison({
    ...preparePriceComparisonParams(params, type),
    type: "priceSummary",
  });

  const summary = response?.data?.data;
  if (!summary) return null;

  const priced = summary.pricedItems || {};
  const margin =
    (type === "network" ? summary.b2bAvgMargin : summary.b2cAvgMargin) || {};
  const lowMargin = summary.lowMargin || {};

  return {
    pricedCount: priced.configuredPrice || 0,
    totalCount: priced.totalDeals || 0,
    avgMarginLabel: `${CommonService.roundedByDecimalPlace(
      margin.percentage || 0,
      2,
    )}%`,
    lowMarginCount: lowMargin.count || 0,
  };
};

/** One buyer group the B2B sheet renders a price column for. */
export interface PriceGroupColumn {
  id: string;
  name: string;
  sellersCount: number;
  /**
   * Position in the full group list. The sheet colours a group by this, so a
   * group keeps its colour when the group filter narrows the columns down to
   * it alone.
   */
  toneIndex: number;
}

/**
 * Buyer groups configured by this franchise — each becomes its own price
 * column on the B2B sheet, with the deal's group price under it. B2C carries a
 * single price for everyone, so only the B2B sheet calls this.
 */
export const getPriceGroups = async (): Promise<PriceGroupColumn[]> => {
  const response = await SellerGroupPriceConfigService.getGroups({
    filter: {
      type: GROUP_TYPE,
      "franchiseInfo.id": AuthService.getLoggedInUserId(),
    },
    page: 1,
    count: 20,
  });

  return (response?.data?.data || []).map((group: any, index: number) => ({
    id: group._id || group.id || "",
    name: group.name || "",
    sellersCount: group.sellersInfo?.length || group.sellersCount || 0,
    toneIndex: index,
  }));
};

export const getCount = async (
  params: Record<string, any>,
  type?: "network" | "customer",
) => {
  const p: Record<string, any> = {
    ...preparePriceComparisonParams(params, type),
    outputType: "count",
  };

  delete p.page;
  delete p.limit;
  delete p.sort;

  const response = await SellerCatalogService.getPriceComparison(p);

  return response.data?.count || 0;
};
