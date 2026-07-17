import { s } from "node_modules/@fullcalendar/core/internal-common";
import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts(params);
    return SellerCatalogService.formatProductResponse(
      Array.isArray(response.data?.data) ? response.data?.data : [],
    );
  } catch (error) {
    console.error("Error fetching cases:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts({
      ...params,
      outputType: "count",
    });
    return response.data?.count || 0;
  } catch (error) {
    console.error("Error fetching cases count:", error);
    return 0;
  }
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
) => {
  let params: Record<string, any> = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {},
  };

  const sellingType = filter.sellingType || "all";
  const { search, alpha } = filter || {};

  if (search?.trim()) {
    params.filter.search = search.trim();
  }

  if (sellingType === "Case") {
    params.filter.$and = [
      { packConfig: { $elemMatch: { isDefault: true, packType: "Case" } } },
    ];
  } else if (sellingType === "InnerCase") {
    params.filter.$and = [
      {
        packConfig: { $elemMatch: { isDefault: true, packType: "InnerCase" } },
      },
    ];
  } else if (sellingType === "NotConfigured") {
    params.filter.packConfig = { $exists: false };
  } else {
    params.filter.$and = [{ packConfig: { $elemMatch: { isDefault: true } } }];
  }

  if (alpha) {
    params.filter.dealName = CommonService.prepareAlphaRegexFilter(alpha);
  }

  return params;
};

export const getSummary = async (filters: Record<string, any>) => {
  const promises = [
    getCount(prepareParams({ ...filters, sellingType: "Case" })),
    getCount(prepareParams({ ...filters, sellingType: "InnerCase" })),
  ];

  const [caseCount, innerCaseCount] = await Promise.all(promises);

  return {
    caseCount: caseCount || 0,
    innerCaseCount: innerCaseCount || 0,
  };
};
