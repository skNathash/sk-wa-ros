import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import VendorService from "~/services/VendorService";
import { merge } from "lodash";
import ProductService from "~/services/ProductService";
import type { AxiosRequestConfig } from "axios";

let abortController: AbortController | null = null;

const getInventoryCategories = async (
  query: string,
  page: number,
  params?: Record<string, any>,
  config?: AxiosRequestConfig,
) => {
  const p = merge(
    {},
    {
      page,
      limit: 10,
      ...(query ? { search: query } : {}),
      sort: { "_id.categoryName": 1 },
    },
    params,
  );
  const response = await InventorySubscribeService.getCategories(p, config);
  return InventorySubscribeService.formatCategoryResponse(
    response.data?.data || [],
  ).map((item: any) => ({
    label: item._displayName || item.name,
    value: {
      id: item._id,
      name: item._displayName || item.name,
      objId: item.id,
    },
  }));
};

const getSellerCategories = async (
  query: string,
  page: number,
  params?: Record<string, any>,
  config?: AxiosRequestConfig,
) => {
  const p = merge(
    {},
    {
      page: page,
      count: 10,
      filter: {
        ...(query ? { search: query } : {}),
      },
      sort: { "_id.categoryName": 1 },
    },
    params,
  );
  const response = await SellerCatalogService.getCategories(p, config);
  return SellerCatalogService.formatCategoryResponse(response.data.data).map(
    (item: any) => ({
      label: item._displayName || item.name,
      value: {
        id: item._id,
        name: item._displayName || item.name,
        objId: item.objId,
      },
    }),
  );
};

const getVendorCategories = async (
  vendorId: string,
  query: string,
  page: number,
  params?: Record<string, any>,
  config?: AxiosRequestConfig,
) => {
  const p = merge(
    {},
    {
      page,
      limit: 10,
      filter: query ? { search: query } : {},
    },
    params,
  );
  const response = await VendorService.getCategories(vendorId, p, config);
  return response.data.data.map((item: any) => ({
    label: item._displayName || item.categoryName,
    value: {
      id: item.categoryId,
      name: item._displayName || item.categoryName,
      objId: item.id,
    },
  }));
};

/**
 * Fetches network categories with optional search and pagination
 */
const getNetworkCategories = async (
  query: string,
  page: number,
  params?: Record<string, any>,
) => {
  const p = merge(
    {},
    {
      page,
      count: 10,
      filter: {
        ...(query ? { search: query } : {}),
        status: "Active",
      },
      sort: { "_id.categoryName": 1 },
      distance: 10, // Default distance of 10km, can be overridden in params
    },
    params,
  );

  try {
    const response = await SellerCatalogService.getNetworkCategories(p);
    return SellerCatalogService.formatCategoryResponse(
      response.data?.data || [],
    ).map((item: any) => ({
      label: item._displayName || item.name,
      value: { id: item._id, name: item._displayName || item.name },
    }));
  } catch (error) {
    console.error("Error fetching network categories:", error);
    return [];
  }
};

/**
 * Fetches regular product categories
 */
const getCategories = async (
  query: string,
  page: number,
  params?: Record<string, any>,
  config?: AxiosRequestConfig,
) => {
  const p: Record<string, any> = merge(
    {},
    {
      page: page,
      count: 10,
      filter: { status: "Active" },
      sort: { name: 1 },
    },
    params,
  );

  if (query) {
    p.filter = { ...p.filter, name: { $regex: query, $options: "i" } };
  }

  const response = await ProductService.getCategories(p, config);
  if (Array.isArray(response.data)) {
    return response.data?.map((item: any) => ({
      label: item._displayName || item.name,
      value: {
        id: item._id,
        name: item._displayName || item.name,
        objId: item.id,
      },
    }));
  }
  return [];
};

export const getData = async (
  query: string,
  page: number,
  feature?: string,
  options?: { vendorId?: string; params?: Record<string, any> },
) => {
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  if (feature === "pos") {
    return getSellerCategories(query, page, options?.params, {
      signal: abortController?.signal,
    });
  } else if (feature === "vendor") {
    const vendorId = options?.vendorId || "";
    return getVendorCategories(vendorId, query, page, options?.params, {
      signal: abortController?.signal,
    });
  } else if (feature === "inventory-subscribe") {
    return getInventoryCategories(query, page, options?.params, {
      signal: abortController?.signal,
    });
  } else if (feature === "network-buy") {
    return getNetworkCategories(query, page, options?.params);
  } else {
    return getCategories(query, page, options?.params, {
      signal: abortController?.signal,
    });
  }
};
