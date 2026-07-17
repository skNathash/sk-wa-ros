import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import VendorService from "~/services/VendorService";
import { merge } from "lodash";
import ProductService from "~/services/ProductService";

const getInventoryCategories = async (
  query: string,
  page: number,
  params?: Record<string, any>
) => {
  const p = merge(
    {},
    {
      page,
      limit: 10,
      ...(query ? { search: query } : {}),
      sort: { "_id.parentCategoryName": 1 },
    },
    params
  );
  const response = await InventorySubscribeService.getParentCategories(p);
  return InventorySubscribeService.formatParentCategoryResponse(
    response.data?.data || []
  ).map((item: any) => ({
    label: item._displayName || item.name,
    value: { id: item._id, name: item._displayName || item.name },
  }));
};

const getSellerCategories = async (
  query: string,
  page: number,
  params?: Record<string, any>
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
    params
  );
  const response = await SellerCatalogService.getCategories(p);
  return SellerCatalogService.formatCategoryResponse(response.data.data).map(
    (item: any) => ({
      label: item._displayName || item.name,
      value: { id: item._id, name: item._displayName || item.name },
    })
  );
};

const getVendorCategories = async (
  vendorId: string,
  query: string,
  page: number,
  params?: Record<string, any>
) => {
  const p = merge(
    {},
    {
      page,
      limit: 10,
      filter: query ? { search: query } : {},
    },
    params
  );
  const response = await VendorService.getCategories(vendorId, p);
  return response.data.data.map((item: any) => ({
    label: item._displayName || item.categoryName,
    value: {
      id: item.categoryId,
      name: item._displayName || item.categoryName,
    },
  }));
};

const getCategories = async (
  query: string,
  page: number,
  params?: Record<string, any>
) => {
  const p = merge(
    {},
    {
      page: page,
      count: 10,
      filter: query ? { name: query, status: "Active" } : {},
      sort: { name: 1 },
    },
    params
  );
  const response = await ProductService.getCategories(p);
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
  options?: { vendorId?: string; params?: Record<string, any> }
) => {
  if (feature === "pos") {
    return getSellerCategories(query, page, options?.params);
  } else if (feature === "vendor") {
    const vendorId = options?.vendorId || "";
    return getVendorCategories(vendorId, query, page, options?.params);
  } else if (feature === "inventory-subscribe") {
    return getInventoryCategories(query, page, options?.params);
  } else {
    return getCategories(query, page, options?.params);
  }
};
