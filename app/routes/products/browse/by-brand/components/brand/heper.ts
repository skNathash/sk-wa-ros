import type { PaginationState } from "~/types/CommonTypes";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import CommonService from "~/services/CommonService";
import ProductService from "~/services/ProductService";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await ProductService.getSpcBrands(params);
    return {
      data: response.data,
    };
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };
  delete p.page;
  delete p.count;
  try {
    // const response = await ProductService.getDealRefinement({
    //   ...p,
    //   showColumns: ["brandArray"],
    // });
    const response = await ProductService.getSpcBrands({
      ...p,
      outputType: "count",
    });
    return response.data?.[0]?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const prepareParams = (
  params: Record<string, any>,
  pagination: PaginationState
) => {
  let p: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    brandFilter: {},
    sort: {
      name: 1,
    },
  };

  // Handle search filter
  if (params.search) {
    const search = params.search.trim();
    if (search) {
      p.brandFilter["name"] = {
        $regex: search,
        $options: "i",
      };
    }
  }

  // Handle alpha filter
  if (params.alpha) {
    p.brandFilter["name"] = CommonService.prepareAlphaRegexFilter(params.alpha);
  }

  if (params.category?._id) {
    p.filter["categoryFilter"] = {
      _id: params.category._id,
    };
  }

  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  return p;
};
