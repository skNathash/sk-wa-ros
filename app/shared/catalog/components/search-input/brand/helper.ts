import type { AxiosRequestConfig } from "axios";
import { merge } from "lodash";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import VendorService from "~/services/VendorService";

let abortController: AbortController | null = null;

const getSellerBrands = async (
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
      sort: { "_id.brandName": 1 },
    },
    params,
  );
  const response = await SellerCatalogService.getBrands(p, config);
  return SellerCatalogService.formatBrandResponse(
    response.data?.data || [],
  ).map((item: any) => ({
    label: item._dispalyName || item.name,
    value: {
      id: item._id,
      name: item._dispalyName || item.name,
      objId: item.id,
    },
  }));
};

const getVendorBrands = async (
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
      sort: { name: 1 },
    },
    params,
  );
  const response = await VendorService.getBrands(vendorId, p, config);
  return response.data?.data?.map((item: any) => ({
    label: item._dispalyName || item.brandName,
    value: { id: item.brandId, name: item._dispalyName || item.brandName },
  }));
};

const getInventoryBrands = async (
  query: string,
  page: number,
  params?: Record<string, any>,
  config?: AxiosRequestConfig,
) => {
  const p = merge(
    {},
    {
      page: page,
      limit: 10,
      ...(query ? { search: query } : {}),
      sort: { "_id.brandName": 1 },
    },
    params,
  );
  const response = await InventorySubscribeService.getBrands(p, config);

  return InventorySubscribeService.formatBrandResponse(
    response.data?.data || [],
  ).map((item: any) => ({
    label: item._dispalyName || item.name,
    value: { id: item._id, name: item._dispalyName || item.name },
  }));
};

const getBrands = async (
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

  const response = await ProductService.getBrands(p, {}, config);
  return response.data?.data?.map((item: any) => ({
    label: item._dispalyName || item.name,
    value: {
      id: item._id,
      name: item._dispalyName || item.name,
      objId: item.id,
    },
  }));
};

const getNetworkBrands = async (
  query: string,
  page: number,
  params?: Record<string, any>,
) => {
  const p = merge(
    {},
    {
      page: page,
      count: 10,
      filter: {
        ...(query ? { search: query } : {}),
        status: "Active",
      },
      sort: { "_id.brandName": 1 },
      distance: 10,
    },
    params,
  );

  try {
    const response = await SellerCatalogService.getNetworkBrands(p);
    return SellerCatalogService.formatBrandResponse(
      response.data?.data || [],
    ).map((item: any) => ({
      label: item._dispalyName || item.name,
      value: { id: item._id, name: item._dispalyName || item.name },
    }));
  } catch (error) {
    console.error("Error fetching network brands:", error);
    return [];
  }
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
    return getSellerBrands(query, page, options?.params, {
      signal: abortController?.signal,
    });
  } else if (feature === "vendor") {
    const vendorId = options?.vendorId || "";
    return getVendorBrands(vendorId, query, page, options?.params, {
      signal: abortController?.signal,
    });
  } else if (feature === "inventory-subscribe") {
    return getInventoryBrands(query, page, options?.params, {
      signal: abortController?.signal,
    });
  } else if (feature === "network-buy") {
    return getNetworkBrands(query, page, options?.params);
  } else {
    return getBrands(query, page, options?.params, {
      signal: abortController?.signal,
    });
  }
};
