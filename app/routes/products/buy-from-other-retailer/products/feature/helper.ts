import SellerCatalogService from "~/services/SellerCatalogService";
import {
  catalogOverviewItems,
  catalogOverviewParamBuilders,
} from "~/shared/catalog/components/supply-catalog-pane/CatalogOverview";
import type { PaginationState } from "~/types/CommonTypes";

export { getFirstSeller } from "~/shared/products/reorder-card/helper";

export interface FilterFormData {
  search: string;
}

export const defaultFilter: FilterFormData = {
  search: "",
};

/** Resolves the overview tile (title/subtitle/icon) behind a data-point key. */
export const getFeatureItem = (key: string) =>
  catalogOverviewItems.find((item) => item.key === key);

/**
 * Prepares query parameters from filter form data, preserving the
 * non-filter params (data-point key, distance) already present in the URL.
 */
export const prepareFilterQueryParams = (
  formData: FilterFormData,
  currentSearchParams: URLSearchParams,
): Record<string, any> => {
  const params: Record<string, any> = {};

  const key = currentSearchParams.get("key");
  if (key) {
    params.key = key;
  }

  if (formData.search?.trim()) {
    params.search = formData.search.trim();
  }

  const distance = currentSearchParams.get("distance");
  if (distance) {
    params.distance = distance;
  }

  const from = currentSearchParams.get("from");
  if (from) {
    params.from = from;
  }

  return params;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  key: string,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  // Remove filter if empty
  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  // Same per-data-point params the overview tiles use for their counts;
  // unknown keys fall through to the plain network deals params.
  const buildParams = catalogOverviewParamBuilders[key];
  return buildParams ? buildParams(params) : params;
};

const normalizeDistance = (distance?: number | string) => {
  if (distance === "all") return "all";
  if (distance == null) return undefined;
  return Number(distance);
};

export const getData = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    const response = await SellerCatalogService.getNetworkDeals(
      params,
      normalizeDistance(distance),
    );
    const data = response.data?.data || [];
    return SellerCatalogService.formatProductResponse(data);
  } catch (error) {
    console.error("Error fetching feature products:", error);
    return [];
  }
};

export const getCount = async (
  params: Record<string, any>,
  distance?: number | string,
) => {
  try {
    const countParams = { ...params, outputType: "count" };
    const response = await SellerCatalogService.getNetworkDeals(
      countParams,
      normalizeDistance(distance),
    );
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching feature products count:", error);
    return 0;
  }
};
