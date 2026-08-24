/**
 * Vendors-by-brand helpers.
 *
 * Data comes from `vendor/brands` (see VendorService.getVendorBrands), shaped
 * as `{ totalBrands, brands: [{ brandId, brandObjectId, brandName, vendorCount,
 * vendorsInfo: [...] }] }`.
 */

import CommonService from "~/services/CommonService";
import VendorService from "~/services/VendorService";
import type { PaginationState } from "~/types/CommonTypes";

export interface BrandVendor {
  /** Mongo id — used for the vendor detail route. */
  _id: string;
  /** Human-readable code, e.g. "VEN85". */
  vendorId: string;
  name: string;
  /** Distance from this retailer, rounded to 1 decimal; undefined when unknown. */
  distanceKm?: number;
  city: string;
  status: string;
  /** This retailer has bought this brand from the vendor before. */
  purchasedBefore?: boolean;
}

export interface BrandGroup {
  /** Mongo id of the brand — React key only. */
  _id: string;
  /** Brand code (BR…) — what the vendor list's brand filter matches on. */
  brandId: string;
  name: string;
  /** Accent used for the group's left border + best-vendor card tint. */
  accent: string;
  /** Total vendors supplying the brand (may exceed `vendors.length`). */
  vendorCount: number;
  vendors: BrandVendor[];
}

/** Accent palette keyed per brand — border + badge chip colors. */
export const brandAccents: Record<
  string,
  { border: string; chipBg: string; chipText: string; cardBorder: string }
> = {
  green: {
    border: "tw:border-l-emerald-600",
    chipBg: "tw:bg-emerald-100",
    chipText: "tw:text-emerald-700",
    cardBorder: "tw:border-emerald-600",
  },
  purple: {
    border: "tw:border-l-purple-500",
    chipBg: "tw:bg-purple-100",
    chipText: "tw:text-purple-700",
    cardBorder: "tw:border-purple-500",
  },
  amber: {
    border: "tw:border-l-amber-500",
    chipBg: "tw:bg-amber-100",
    chipText: "tw:text-amber-700",
    cardBorder: "tw:border-amber-500",
  },
  blue: {
    border: "tw:border-l-sky-600",
    chipBg: "tw:bg-sky-100",
    chipText: "tw:text-sky-700",
    cardBorder: "tw:border-sky-600",
  },
};

/** Accent keys cycled per brand group so adjacent groups never share a color. */
const accentKeys = Object.keys(brandAccents);

export interface FilterFormData {
  search: string;
  /** "all" | "purchased" — only brands already bought from. */
  purchased: string;
  /** Single letter (or "123") the brand name must start with; "" = all. */
  alpha: string;
}

export const defaultFilter: FilterFormData = {
  search: "",
  purchased: "all",
  alpha: "",
};

/**
 * Build the query params for `vendor/brands`. Paging follows the app-wide
 * `page`/`count` convention.
 */
export const prepareParams = (
  filter: Partial<FilterFormData> = {},
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  if (filter.search?.trim()) {
    params.filter.$or = [
      {
        "sourceableBrands.brandName": {
          $regex: filter.search.trim(),
          $options: "i",
        },
      },
      {
        name: {
          $regex: filter.search.trim(),
          $options: "i",
        },
      },
    ];
  }

  // Alpha strip narrows on the brand name, not the vendor name — the groups
  // are brands, so "M" should read as "brands starting with M".
  if (filter.alpha) {
    params.filter["sourceableBrands.brandName"] =
      CommonService.prepareAlphaRegexFilter(filter.alpha);
  }

  if (filter.purchased === "purchased") {
    params.purchasedBefore = true;
  }

  return params;
};

/**
 * `distanceKm` is the road distance from this retailer to the vendor. Comes
 * back null/absent when either side has no geo-coordinates — the cards then
 * simply drop the distance line.
 */
export const formatDistance = (value: any) =>
  value != null && value !== "" && Number.isFinite(Number(value))
    ? CommonService.roundedByDecimalPlace(Number(value), 1)
    : undefined;

const formatVendors = (vendors: any[]): BrandVendor[] =>
  (Array.isArray(vendors) ? vendors : []).map((vendor: any) => ({
    _id: String(vendor.id ?? ""),
    vendorId: vendor.vendorId ?? "",
    name: vendor.name ?? "",
    distanceKm: formatDistance(vendor.distanceKm),
    city: vendor.city ?? "",
    status: vendor.status ?? "",
    purchasedBefore: Boolean(vendor.purchasedBefore),
  }));

/**
 * Map the API rows onto the BrandGroup shape the cards render. Vendors already
 * purchased from are floated to the front so they lead each row.
 */
export const formatBrandGroups = (
  brands: any[],
  /** Index of the first row within the full list, so paged-in groups keep the
      accent cycle running instead of restarting it. */
  startIndex = 0,
): BrandGroup[] =>
  (Array.isArray(brands) ? brands : []).map((brand: any, i: number) => {
    const idx = startIndex + i;
    const vendors = formatVendors(brand.vendorsInfo);

    return {
      _id: String(brand.brandObjectId ?? brand.brandId ?? ""),
      brandId: brand.brandId ?? "",
      // brandName can come back null — fall back to the brand code so the
      // group header is never blank.
      name: brand.brandName || brand.brandId || "",
      accent: accentKeys[idx % accentKeys.length],
      vendorCount: Number(brand.vendorCount) || vendors.length,
      vendors: [
        ...vendors.filter((v) => v.purchasedBefore),
        ...vendors.filter((v) => !v.purchasedBefore),
      ],
    };
  });

/** Fetch one page of brand→vendor groups. Returns [] on failure (view shows NoData). */
export const getData = async (
  params: Record<string, any> = {},
  startIndex = 0,
): Promise<BrandGroup[]> => {
  try {
    const response = await VendorService.getVendorBrands(params);
    if (response.statusCode === 200) {
      return formatBrandGroups(response.data?.data?.brands, startIndex);
    }
    return [];
  } catch (error) {
    console.error("Error fetching vendor brands:", error);
    return [];
  }
};

/**
 * Total brand count for the current filter. The list response already carries
 * `totalBrands`, so this reuses the same endpoint with `outputType=count` and
 * falls back to that key when the backend ignores the flag.
 */
export const getCount = async (params: Record<string, any> = {}) => {
  try {
    const countParams: Record<string, any> = {
      ...params,
      outputType: "count",
    };
    delete countParams.page;
    delete countParams.count;

    const response = await VendorService.getVendorBrands(countParams);
    if (response.statusCode === 200) {
      const data = response.data?.data;
      // `data` is either the count itself or the full `{ totalBrands, brands }`.
      return Number(typeof data === "number" ? data : data?.totalBrands) || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching vendor brands count:", error);
    return 0;
  }
};

/**
 * Header summary — total brands for the filter plus the vendor mappings across
 * the brands loaded so far (a vendor supplying two brands counts twice).
 */
export const getSummary = (groups: BrandGroup[], totalBrands: number) => ({
  totalBrands,
  totalVendors: groups.reduce((sum, group) => sum + group.vendorCount, 0),
});
