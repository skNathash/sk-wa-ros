import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import VendorService from "~/services/VendorService";
import { merge } from "lodash";
import ProductService from "~/services/ProductService";

const getSubscribeProducts = async (
  query: string,
  page: number,
  params?: Record<string, any>,
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
  const response = await InventorySubscribeService.getDeals(p);
  return InventorySubscribeService.formatDealResponse(
    response.data?.data || [],
  ).map((item: any) => ({
    label: item.name,
    value: { id: item._id, name: item.name, objId: item.id },
  }));
};

const getSellerProducts = async (
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
      },
      sort: { "_id.categoryName": 1 },
    },
    params,
  );
  const response = await SellerCatalogService.getProducts(p);
  return SellerCatalogService.formatProductResponse(response.data.data).map(
    (item: any) => ({
      label: item.name,
      value: { id: item._id, name: item.name, objId: item.id, dealId: item.id },
    }),
  );
};

const getVendorProducts = async (
  vendorId: string,
  query: string,
  page: number,
  params?: Record<string, any>,
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
  const response = await VendorService.getProducts(vendorId, p);
  return response.data.data.map((item: any) => ({
    label: item.name,
    value: {
      id: item._id,
      name: item.name,
      objId: item.id,
    },
  }));
};

const getProducts = async (
  query: string,
  page: number,
  params?: Record<string, any>,
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

  const response = await ProductService.getProducts(p);
  if (Array.isArray(response.data)) {
    return response.data?.map((item: any) => ({
      label: item.name,
      value: {
        id: item._id,
        name: item.name,
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
  if (feature === "pos") {
    return getSellerProducts(query, page, options?.params);
  } else if (feature === "vendor") {
    const vendorId = options?.vendorId || "";
    return getVendorProducts(vendorId, query, page, options?.params);
  } else if (feature === "inventory-subscribe") {
    return getSubscribeProducts(query, page, options?.params);
  } else {
    return getProducts(query, page, options?.params);
  }
};
