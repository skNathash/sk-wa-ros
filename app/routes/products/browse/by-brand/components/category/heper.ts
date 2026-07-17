import { AuthService } from "~/services/AuthService";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import CommonService from "~/services/CommonService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>, type?: string) => {
  try {
    // Determine type if not provided
    const viewType = type || (AuthService.isBuyerUser() ? "buyer" : "normal");

    if (viewType === "buyer") {
      const response = await SellerCatalogService.getCategories(params);
      return {
        data: SellerCatalogService.formatCategoryResponse(
          response.data.data || []
        ),
      };
    } else {
      const response = await ProductService.getSpcCategories(params);
      return {
        data: response.data || [],
      };
    }
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (params: Record<string, any>, type?: string) => {
  const p = { ...params };
  delete p.page;
  delete p.count;

  try {
    // Determine type if not provided
    const viewType = type || (AuthService.isBuyerUser() ? "buyer" : "normal");

    if (viewType === "buyer") {
      const response = await SellerCatalogService.getCategories({
        ...p,
        outputType: "count",
      });
      return response.data.count || 0;
    } else {
      const response = await ProductService.getSpcCategories({
        ...p,
        outputType: "count",
      });
      return response.data?.[0]?.count || 0;
    }
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const prepareParams = (
  params: Record<string, any>,
  pagination: PaginationState,
  type?: string
) => {
  // Determine type if not provided
  const viewType = type || (AuthService.isBuyerUser() ? "buyer" : "normal");

  if (viewType === "buyer") {
    // Prepare params for SellerCatalogService
    const filter: Record<string, any> = {};

    // Handle search filter
    if (params.search) {
      const search = params.search.trim();
      if (search) {
        filter["name"] = {
          $regex: search,
          $options: "i",
        };
      }
    }

    // Handle alpha filter
    if (params.alpha) {
      filter["name"] = CommonService.prepareAlphaRegexFilter(params.alpha);
    }

    // Add category IDs filter if present
    if (params.categoryIds && params.categoryIds.length > 0) {
      filter["_id"] = { $in: params.categoryIds };
    }

    // Construct the final params object for SellerCatalogService
    const result: any = {
      page: pagination.activePage,
      count: pagination.rowsPerPage,
      sort: { name: 1 },
    };

    // Only add filter if it has properties
    if (Object.keys(filter).length > 0) {
      result.filter = filter;
    }

    return { ...result, parent: true };
  } else {
    // Original logic for ProductService
    let p: Record<string, any> = {
      page: pagination.activePage,
      count: pagination.rowsPerPage,
      filter: {},
      categoryFilter: {
        dealsCount: { $gt: 0 },
      },
      sort: {
        name: 1,
      },
      outputAll: true,
    };

    // Handle search filter
    if (params.search) {
      const search = params.search.trim();
      if (search) {
        p.categoryFilter["name"] = {
          $regex: search,
          $options: "i",
        };
      }
    }

    // Handle alpha filter
    if (params.alpha) {
      p.categoryFilter["name"] = CommonService.prepareAlphaRegexFilter(
        params.alpha
      );
    }

    // Add category IDs filter if present
    if (params.categoryIds && params.categoryIds.length > 0) {
      p["categoryFilter"]._id = { $in: params.categoryIds };
    }

    if (!Object.keys(p.filter).length) {
      delete p.filter;
    }

    return p;
  }
};
