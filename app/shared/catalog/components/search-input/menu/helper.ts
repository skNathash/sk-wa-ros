import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import VendorService from "~/services/VendorService";
import { merge } from "lodash";
import type { AxiosRequestConfig } from "axios";

let abortController: AbortController | null = null;

const getInventoryMenus = async (
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
      sort: {
        "_id.menuName": 1,
      },
    },
    params,
  );
  const response = await InventorySubscribeService.getMenus(p, config);
  return InventorySubscribeService.formatMenuResponse(
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

const getSellerMenus = async (
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
      filter: query ? { search: query } : {},
      sort: { "_id.menuName": 1 },
    },
    params,
  );
  const response = await SellerCatalogService.getMenus(p, config);
  return SellerCatalogService.formatMenuResponse(response.data.data).map(
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

const getVendorMenus = async (
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
      filter: query ? { name: { $regex: query, $options: "i" } } : {},
    },
    params,
  );
  const response = await VendorService.getCategories(vendorId, p, config);
  return response.data.data.map((item: any) => ({
    label: item._displayName || item.name,
    value: {
      id: item._id,
      name: item._displayName || item.name,
      objId: item.id,
    },
  }));
};

const getNetworkMenus = async (
  query: string,
  page: number,
  params?: Record<string, any>,
) => {
  const p = merge(
    {},
    {
      page: page,
      count: 10,
      filter: query ? { search: query } : {},
      sort: { "_id.menuName": 1 },
    },
    params,
  );
  const response = await SellerCatalogService.getNetworkMenus(p);
  return SellerCatalogService.formatMenuResponse(response.data.data).map(
    (item: any) => ({
      label: item._displayName || item.name,
      value: { id: item._id, name: item._displayName || item.name },
    }),
  );
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
    return getSellerMenus(query, page, options?.params, {
      signal: abortController?.signal,
    });
  } else if (feature === "vendor") {
    const vendorId = options?.vendorId || "";
    return getVendorMenus(vendorId, query, page, options?.params, {
      signal: abortController?.signal,
    });
  } else if (feature === "inventory-subscribe") {
    return getInventoryMenus(query, page, options?.params, {
      signal: abortController?.signal,
    });
  } else if (feature === "network-buy") {
    return getNetworkMenus(query, page, options?.params);
  } else {
    return getSellerMenus(query, page, options?.params, {
      signal: abortController?.signal,
    });
  }
};
