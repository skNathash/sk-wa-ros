import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";
import { merge } from "lodash";

export type FilterFormData = {
  menu: any[];
  category: any[];
  brand: any[];
  search: string;
  showOnlySchemes: boolean;
};

export const defaultFilter: FilterFormData = {
  menu: [],
  category: [],
  brand: [],
  search: "",
  showOnlySchemes: false,
};

export const getData = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getProducts(params);
  return SellerCatalogService.formatProductResponse(response.data.data, {
    view: "buyer",
  })?.map((e) => {
    return {
      ...e,
      buyFromOtherRetailer: {
        status: true,
        retailerId: params.sellerId,
      },
    };
  });
};

export const getCount = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getProducts({
    ...params,
    outputType: "count",
  });
  return response.data.count;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = merge(
    {},
    SellerCatalogService.getBaseParamsToBuyProduct(),
    {
      page: pagination.activePage,
      count: pagination.rowsPerPage,
      sellerId: filter.retailerId,
      parent: true,
      filter: {
        isLocalDeal: false,
      },
    },
  );

  if (filter.showOnlySchemes) {
    params.networkPriceConfig = "OfferOfTheDay";
  }

  if (filter.search?.trim()) {
    params.filter.search = filter.search?.trim();
  }

  if (filter.menu?.length > 0) {
    params.filter["applicableMenu.menuId"] = {
      $in: filter.menu.map((item: any) => item.value.id),
    };
  }

  if (filter.category?.length > 0) {
    params.filter["applicableCategory.categoryId"] = {
      $in: filter.category.map((item: any) => item.value.id),
    };
  }

  if (filter.brand?.length > 0) {
    params.filter["applicableBrand.brandId"] = {
      $in: filter.brand.map((item: any) => item.value.id),
    };
  }

  if (filter.productId) {
    params.filter.dealId = filter.productId;
  }

  return params;
};
