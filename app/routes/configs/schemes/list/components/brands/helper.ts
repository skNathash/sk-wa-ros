import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";

export const prepareParams = (
  filter: {
    search?: string;
    alpha?: string;
    status?: string;
  } = {},
  pagination: PaginationState
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    limit: pagination?.rowsPerPage,
    filter: {},
    sort: {
      "_id.brandName": 1,
    },
  };

  const { search, alpha, status } = filter || {};

  if (search) {
    params.filter["applicableBrand.brandName"] = {
      $regex: search,
      $options: "i",
    };
  }

  if (alpha) {
    params.filter["applicableBrand.brandName"] =
      CommonService.prepareAlphaRegexFilter(alpha);
  }

  if (status) {
    if (status === "running") {
      params.networkPriceConfig = "OfferOfTheDay";
    }
    if (status === "upcoming") {
      params.networkPriceConfig = "UpcomingOffer";
    }
    if (status === "expired") {
      params.networkPriceConfig = "ExpiredOffer";
    }
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getBrands(params);
    return {
      data: SellerCatalogService.formatBrandResponse(response.data?.data || []),
    };
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getBrands({
      ...params,
      outputType: "count",
    });
    return response.data?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
