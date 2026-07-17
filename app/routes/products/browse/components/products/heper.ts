import type { PaginationState } from "~/types/CommonTypes";
import { AuthService } from "~/services/AuthService";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import CommonService from "~/services/CommonService";

export const getData = async (params: Record<string, any>, type?: string) => {
  try {
    // Determine type if not provided
    const viewType = type || (AuthService.isBuyerUser() ? "buyer" : "normal");

    let data: any[] = [];
    if (viewType === "buyer") {
      const response = await SellerCatalogService.getProducts(params);
      data = SellerCatalogService.formatProductResponse(
        response.data.data || []
      );
    } else {
      const response = await ProductService.getProducts(params);
      data = response.data;
    }

    // with stock
    const withStock = data
      .filter((item) => !item.isOutOfStock)
      .map((e) => ({ ...e, showOtherDeals: false }));

    // without stock
    const outOfStockItems = data.filter((item) => item.isOutOfStock);

    data = [...withStock, ...outOfStockItems];
    return { data };
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
      const response = await SellerCatalogService.getProducts({
        ...p,
        outputType: "count",
      });
      return response.data.count || 0;
    } else {
      const response = await ProductService.getProductCount(p);
      return response.count;
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

    // Add category filter if exists
    if (params.category?._id) {
      filter["applicableCategory.categoryId"] = params.category._id;
    }

    // Add brand filter if exists
    if (params.brand?._id) {
      filter["applicableBrand.brandId"] = params.brand._id;
    }

    // Handle search filter
    if (params.search) {
      const search = params.search.trim();
      if (search) {
        if (/^D\d+$/.test(search)) {
          filter.dealId = search;
        } else {
          filter.dealName = {
            $regex: search,
            $options: "i",
          };
        }
      }
    }

    // Handle alpha filter
    if (params.alpha) {
      filter["name"] = CommonService.prepareAlphaRegexFilter(params.alpha);
    }

    // Construct the final params object for SellerCatalogService
    const result: any = {
      page: pagination.activePage,
      count: pagination.rowsPerPage,
    };

    // Only add filter if it has properties
    if (Object.keys(filter).length > 0) {
      result.filter = filter;
    }

    return { ...result, parent: true };
  } else {
    // Original logic for ProductService
    const filter: Record<string, any> = {};

    // Add category filter if exists
    if (params.category?._id) {
      filter.category = params.category._id;
    }

    // Add brand filter if exists
    if (params.brand?._id) {
      filter.brand = params.brand._id;
    }

    // Handle search filter
    if (params.search) {
      const search = params.search.trim();
      if (search) {
        if (/^D\d+$/.test(search)) {
          filter._id = search;
        } else {
          filter.name = {
            $regex: search,
            $options: "i",
          };
        }
      }
    }

    // Handle alpha filter
    if (params.alpha) {
      filter["name"] = CommonService.prepareAlphaRegexFilter(params.alpha);
    }

    // Construct the final params object
    const result: any = {
      page: pagination.activePage,
      count: pagination.rowsPerPage,
      excludeOutOfStock: true,
    };

    // Only add filter if it has properties
    if (Object.keys(filter).length > 0) {
      result.filter = filter;
    }

    return result;
  }
};
