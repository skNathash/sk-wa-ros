import CommonService from "~/services/CommonService";
import ProductService from "~/services/ProductService";
import type { PaginationState } from "~/types/CommonTypes";
import type { BrandItem } from "./components/BrandList";

export const prepareParams = (
  filter: { search?: string; alpha?: string } = {},
  pagination: PaginationState,
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    brandFilter: {},
    sort: { name: 1 },
  };

  const { search, alpha } = filter || {};

  if (search) {
    params.brandFilter["name"] = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  if (alpha) {
    params.brandFilter["name"] = CommonService.prepareAlphaRegexFilter(alpha);
  }

  return params;
};

const formatBrands = (brands: any[]): BrandItem[] =>
  (brands || []).map((brand) => ({
    _id: brand._id,
    name: brand.name,
    _displayName: brand._displayName || brand.name,
    _displayImg: brand.image || brand._displayImg || brand.images?.[0] || "",
    dealsCount: brand.dealsCount,
  }));

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await ProductService.getSpcBrands(params);
    return formatBrands(response.data || []);
  } catch (error) {
    console.error("Error fetching SK brands:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };
  delete p.page;
  delete p.count;
  try {
    const response = await ProductService.getSpcBrands({
      ...p,
      outputType: "count",
    });
    return response.data?.[0]?.count || 0;
  } catch (error) {
    console.error("Error fetching SK brands count:", error);
    return 0;
  }
};
