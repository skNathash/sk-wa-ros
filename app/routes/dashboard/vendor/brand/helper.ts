/**
 * Vendors-for-one-brand helpers.
 *
 * Same endpoint as the grouped "Vendors by brand" view
 * (`vendor/brands` — see VendorService.getVendorBrands) but called with
 * `outputType=list`, which flattens the response to the vendor rows supplying
 * the requested brand instead of brand groups.
 */

import CommonService from "~/services/CommonService";
import VendorService from "~/services/VendorService";
import type { PaginationState } from "~/types/CommonTypes";
import { formatDistance } from "../brands/helper";

export interface BrandVendor {
  /** Mongo id — used for the vendor detail route. */
  _id: string;
  /** Human-readable code, e.g. "VEN85". */
  vendorId: string;
  name: string;
  /** Up to 3 letters from the name, for the card's chip. "#" when unnamed. */
  initials: string;
  /** Distance from this retailer, rounded to 1 decimal; undefined when unknown. */
  distanceKm?: number;
  city: string;
  status: string;
  /** This retailer has bought this brand from the vendor before. */
  purchasedBefore?: boolean;
}

export interface FilterFormData {
  search: string;
  /** "all" | "purchased" — only vendors already bought this brand from. */
  purchased: string;
  /** Single letter (or "123") the vendor name must start with; "" = all. */
  alpha: string;
}

export const defaultFilter: FilterFormData = {
  search: "",
  purchased: "all",
  alpha: "",
};

/**
 * Build the query params for `vendor/brands` in list mode. Paging follows the
 * app-wide `page`/`count` convention.
 */
export const prepareParams = (
  filter: Partial<FilterFormData> = {},
  pagination: PaginationState,
  brandId?: string,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    outputType: "list",
    filter: {},
  };

  if (brandId) {
    params.filter["sourceableBrands.brandId"] = brandId;
  }

  if (filter.search?.trim()) {
    params.filter.name = {
      $regex: filter.search.trim(),
      $options: "i",
    };
  }

  // In list mode the rows are vendors, so the alpha strip narrows on the
  // vendor name (in the grouped view it narrows on the brand name).
  if (filter.alpha) {
    params.filter.name = CommonService.prepareAlphaRegexFilter(filter.alpha);
  }

  if (filter.purchased === "purchased") {
    params.purchasedBefore = true;
  }

  return params;
};

export const formatVendors = (vendors: any[]): BrandVendor[] =>
  (Array.isArray(vendors) ? vendors : []).map((vendor: any) => ({
    _id: String(vendor.id ?? vendor._id ?? ""),
    vendorId: vendor.vendorId ?? "",
    name: vendor.name ?? "",
    initials: CommonService.prepareInitials(vendor.name ?? "", 3),
    distanceKm: formatDistance(vendor.distanceKm),
    city: vendor.city ?? "",
    status: vendor.status ?? "",
    purchasedBefore: Boolean(vendor.purchasedBefore),
  }));

/**
 * Fetch one page of vendors for the brand. Returns [] on failure (the view
 * shows NoData). The payload key differs by backend build, so the vendor rows
 * are picked from whichever of `vendors`/`data`/the bare array is present.
 */
export const getData = async (
  params: Record<string, any> = {},
): Promise<BrandVendor[]> => {
  try {
    const response = await VendorService.getVendorBrands(params);
    if (response.statusCode === 200) {
      const data = response.data?.data;
      const rows = Array.isArray(data) ? data : data?.vendors || [];
      return formatVendors(rows);
    }
    return [];
  } catch (error) {
    console.error("Error fetching brand vendors:", error);
    return [];
  }
};

/** Total vendor count for the current filter. */
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
      return data?.totalVendors || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching brand vendors count:", error);
    return 0;
  }
};
