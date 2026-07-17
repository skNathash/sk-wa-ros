import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export type SchemeFilterForm = {
  search: string;
  dateRange: any[];
  status: string;
  alpha: string;
  brandId?: string;
};

export const getData = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getProducts(params);
  return SellerCatalogService.formatProductResponse(response.data.data);
};

export const getCount = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getProducts({
    ...params,
    outputType: "count",
  });
  return response.data.count;
};

export const prepareParams = (
  filter: SchemeFilterForm,
  pagination?: PaginationState,
) => {
  const p: Record<string, any> = {
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
    filter: {},
    sort: { "networkSellingPrice.offerOfTheDay.updatedAt": -1 },
  };

  if (filter.search?.trim()) {
    p.filter.search = filter.search?.trim();
  }

  if (filter.alpha) {
    p.filter.dealName = CommonService.prepareAlphaRegexFilter(filter.alpha);
  }

  if (filter.status && filter.status !== "all") {
    if (filter.status === "running") {
      p.networkPriceConfig = "OfferOfTheDay";
    }

    if (filter.status === "upcoming") {
      p.networkPriceConfig = "UpcomingOffer";
    }

    if (filter.status === "expired") {
      p.networkPriceConfig = "ExpiredOffer";
    }
  }

  if (filter.brandId) {
    p.filter["applicableBrand.brandId"] = filter.brandId;
  }

  return p;
};

export const getSummary = async (filters: SchemeFilterForm) => {
  try {
    const promises = [
      getCount(prepareParams({ ...filters, status: "running" })),
      getCount(prepareParams({ ...filters, status: "upcoming" })),
      getCount(prepareParams({ ...filters, status: "expired" })),
    ];

    const [runningCount, upcomingCount, expiredCount] =
      await Promise.all(promises);

    return {
      runningCount: runningCount || 0,
      upcomingCount: upcomingCount || 0,
      expiredCount: expiredCount || 0,
      totalCount:
        (runningCount || 0) + (upcomingCount || 0) + (expiredCount || 0),
    };
  } catch (error) {
    console.error("Error fetching summary:", error);
    return {
      runningCount: 0,
      upcomingCount: 0,
      expiredCount: 0,
      totalCount: 0,
    };
  }
};
