import { AuthService } from "~/services/AuthService";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { Deal } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>, type?: string) => {
  try {
    const viewType = type || (AuthService.isBuyerUser() ? "buyer" : "normal");

    if (viewType === "buyer") {
      const response = await SellerCatalogService.getProducts(params);
      const formattedData: any[] = SellerCatalogService.formatProductResponse(
        response.data.data || [],
        {
          priceSlabFormatType: "b2b",
        },
      );

      // Move out-of-stock items to the end while preserving relative order
      const inStock: any[] = [];
      const outOfStock: any[] = [];
      for (const item of formattedData) {
        if (item && item.isOutOfStock) outOfStock.push(item);
        else inStock.push(item);
      }

      return { data: [...inStock, ...outOfStock] };
    } else {
      const response = await ProductService.getProducts(params);
      const dataArray: any[] = response.data || [];

      // Move out-of-stock items to the end while preserving relative order
      const inStock: any[] = [];
      const outOfStock: any[] = [];
      for (const item of dataArray) {
        if (item && item.isOutOfStock) outOfStock.push(item);
        else inStock.push(item);
      }

      return {
        data: [...inStock, ...outOfStock].map((e) => ({
          ...e,
          showOtherDeals: true,
        })),
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
  pagination: any,
  type?: string,
) => {
  // Determine type if not provided
  const viewType = type || (AuthService.isBuyerUser() ? "buyer" : "normal");

  if (viewType === "buyer") {
    // Prepare params for SellerCatalogService
    const filter: Record<string, any> = {
      status: "Active",
      availableQuantity: { $gt: 0 },
    };

    // Collect category IDs
    const categoryIds: string[] = [];

    // Add single category from slider if exists
    if (params.category?.id) {
      categoryIds.push(params.category.id);
    }

    // Add multiple categories from filter modal if they exist
    if (params.categories?.length > 0) {
      const modalCategoryIds = params.categories
        .filter((c: any) => c?._id)
        .map((c: any) => c._id);
      categoryIds.push(...modalCategoryIds);
    }

    // Add category filter if we have any category IDs
    if (categoryIds.length > 0) {
      // SellerCatalog expects applicableCategory.categoryId
      filter["applicableCategory.categoryId"] = {
        $in: [...new Set(categoryIds)],
      };
    }

    // Collect brand IDs
    if (params.brands?.length > 0) {
      const brandIds = params.brands
        .filter((b: any) => b?._id)
        .map((b: any) => b._id);

      if (brandIds.length > 0) {
        // SellerCatalog expects applicableBrand.brandId
        filter["applicableBrand.brandId"] = {
          $in: [...new Set(brandIds)],
        };
      }
    }

    // Collect menu IDs (if any)
    if (params.menu?.length > 0) {
      const menuIds = params.menu
        .filter((m: any) => m?._id)
        .map((m: any) => m._id);

      if (menuIds.length > 0) {
        // SellerCatalog expects applicableMenu.menuId
        filter["applicableMenu.menuId"] = {
          $in: [...new Set(menuIds)],
        };
      }
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

    // Construct the final params object for SellerCatalogService
    const result: any = {
      page: pagination.page,
      count: pagination.count,
    };

    // Only add filter if it has properties
    if (Object.keys(filter).length > 0) {
      result.filter = filter;
    }

    return { ...result, parent: true };
  } else {
    // Original logic for ProductService
    const filter: Record<string, any> = {};

    // Collect category IDs
    const categoryIds: string[] = [];

    // Add single category from slider if exists
    if (params.category?.id) {
      categoryIds.push(params.category.id);
    }

    // Add multiple categories from filter modal if they exist
    if (params.categories?.length > 0) {
      const modalCategoryIds = params.categories
        .filter((c: any) => c?._id)
        .map((c: any) => c._id);
      categoryIds.push(...modalCategoryIds);
    }

    // Add category filter if we have any category IDs
    if (categoryIds.length > 0) {
      filter.category = [...new Set(categoryIds)]; // Remove duplicates if any
    }

    // Collect brand IDs
    if (params.brands?.length > 0) {
      const brandIds = params.brands
        .filter((b: any) => b?._id)
        .map((b: any) => b._id);

      if (brandIds.length > 0) {
        filter.brand = [...new Set(brandIds)];
      }
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

    // Construct the final params object
    const result: any = {
      page: pagination.page,
      count: pagination.count,
      excludeOutOfStock: true,
    };

    // Handle catalog specific parameters
    if (params.showSellerCatalog && params.selectedSeller) {
      result.showConnectedSellerStock = true;
      result.connectedSellerId = params.selectedSeller.id;
    } else if (params.showSkCatalog) {
      result.showSkCatalog = true;
    }

    // Only add filter if it has properties
    if (Object.keys(filter).length > 0) {
      result.filter = filter;
    }

    return result;
  }
};

export const prepareSoldUnits = async (data: Deal[]) => {
  return data;
  // const fid = AuthService.getLoggedInUserId();
  // const dealIds = data.map((v) => v.id);

  // if (dealIds.length === 0) return data;

  // const params = {
  //   filter: {
  //     "franchise.id": {
  //       $in: [fid],
  //     },
  //   },
  //   dealIds: dealIds.join(","),
  // };

  // try {
  //   const response = await ProductService.getLastOrderDate(params);
  //   const soldData = response.data || [];

  //   return data.map((v) => {
  //     const soldInfo = soldData.find((e: any) => e._id === v.id);
  //     if (soldInfo && soldInfo.lastOrderDate && soldInfo.totalQty) {
  //       return {
  //         ...v,
  //         soldInfo: {
  //           lastOrder: soldInfo.lastOrderDate,
  //           qty: soldInfo.totalQty,
  //         },
  //       };
  //     }
  //     return v;
  //   });
  // } catch (error) {
  //   console.error("Error fetching sold units:", error);
  //   return data;
  // }
};
