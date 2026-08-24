import { tintIndexFor } from "~/components/core/tint/tints";
import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

/** Form the trend picker's filter block writes into. */
export interface TrendFilterFormFields {
  search: string;
  type: "network" | "customer";
  globalSort: string;
}

export const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 25,
  startSlNo: 1,
  endSlNo: 25,
  totalRecords: 0,
};

export const defaultTrendFilters: TrendFilterFormFields = {
  search: "",
  type: "customer",
  globalSort: "name-asc",
};

/** Peer radius (km) the comparison figures are computed against. */
export const PRICE_COMPARISON_DISTANCE = 15;

/**
 * Builds the `catalog/seller-deals/price-comparison` params for the trend
 * picker: the standard seller-deal block (page / limit / filter / sort) plus
 * the comparison context (seller radius + channel).
 */
export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort?: SortProps,
) => {
  const type = (filters.type || "customer").toString();

  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    distance: PRICE_COMPARISON_DISTANCE,
    priceType: type === "network" ? "b2b" : "b2c",
    filter: {},
  };

  // Sort is sent the way the price sheet sends it — always the object form.
  // The endpoint returns no rows for a bare field name ("name"), while the
  // count query drops sort entirely, which is why a wrong sort reads as
  // "68 SKUs" over an empty list rather than as an error.
  if (sort?.key) {
    params.sort = { [sort.key]: sort.value === "desc" ? -1 : 1 };
  } else if (filters.globalSort === "price-asc") {
    params.sort = { mrp: 1 };
  } else if (filters.globalSort === "price-desc") {
    params.sort = { mrp: -1 };
  } else {
    params.sort = { name: filters.globalSort === "name-desc" ? -1 : 1 };
  }

  if (filters.search?.trim()) {
    params.filter.search = filters.search.trim();
  }

  return params;
};

/** Categories that read as electronics on the segment strip. */
const ELECTRONICS_HINTS = [
  "electronic",
  "appliance",
  "mobile",
  "computer",
  "gadget",
  "audio",
  "tv",
];

const isElectronicsDeal = (item: any) => {
  const name = `${item?.category?.name || ""} ${item?.menu?.name || ""}`
    .toLowerCase()
    .trim();
  return ELECTRONICS_HINTS.some((hint) => name.includes(hint));
};

/** Two-to-three letter avatar tile the design puts before each SKU name. */
const initialsOf = (name: string) =>
  (name || "")
    .replace(/[^a-z0-9 ]/gi, "")
    .trim()
    .slice(0, 3)
    .toUpperCase() || "SKU";

/** One row of the trend picker, shaped for display. */
export interface TrendDeal {
  _id: string;
  id: string;
  name: string;
  /** "ITC · ₹325" — brand (or company) with the price the row is tracked on. */
  subLabel: string;
  initials: string;
  /** Slot in the shared tint palette, so a SKU keeps its colour across pages. */
  tintIndex: number;
  isElectronics: boolean;
  /** Untouched deal, for the detail panel on the right. */
  raw: any;
}

const priceOf = (item: any, type?: "network" | "customer") => {
  const price = type === "network" ? item.b2bPrice : item.b2cPrice;
  return Number(price) > 0 ? Number(price) : Number(item.mrp) || 0;
};

/** A page of picker rows plus the total the API matched the filter against. */
export interface TrendDealPage {
  rows: TrendDeal[];
  /** Rows matching the current filter — `pagination.total` of the response. */
  total: number;
}

/**
 * Deals the trend picker lists — the same price-comparison rows the price
 * sheet runs on, reduced to what the picker renders.
 *
 * The total is read off the same response (`pagination.total`); the endpoint
 * carries no `count` field, so a separate count call would both cost a request
 * and report a different generation than the rows on screen.
 */
export const getData = async (
  params: Record<string, any>,
  type?: "network" | "customer",
): Promise<TrendDealPage> => {
  const response = await SellerCatalogService.getPriceComparison({
    ...params,
    outputType: "list",
  });

  const body: any = response.data || {};


  const formatted = SellerCatalogService.formatProductResponse(
    body.data || [],
  );


  const rows = formatted.map((item: any) => {
    const brand = item.brand?.name || item.companyName || "";
    const price = priceOf(item, type);

    return {
      _id: item._id,
      id: item.id,
      name: item.name,
      subLabel: [brand, price > 0 ? `₹${CommonService.roundedByDecimalPlace(price, 2)}` : ""]
        .filter(Boolean)
        .join(" · "),
      initials: initialsOf(item.name),
      tintIndex: tintIndexFor(item.name),
      isElectronics: isElectronicsDeal(item),
      raw: item,
    };
  });

  return {
    rows,
    total: Number(body.pagination?.total ?? body.count ?? rows.length) || 0,
  };
};

