import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts(params);
    const products = SellerCatalogService.formatProductResponse(
      response.data?.data || [],
    );
    return products.map((product) => {
      const finalPrice = product.b2cPrice || product.mrp;
      return {
        name: product.name,
        mrp: product.mrp,
        price: finalPrice,
        discount: CommonService.roundedByDecimalPlace(product.b2cDiscount, 2),
        saving: CommonService.roundedByDecimalPlace(
          (product.mrp || 0) - finalPrice,
          2,
        ),
      };
    });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts({
      ...params,
      outputType: "count",
    });
    return response.data?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const prepareParams = (filter: Record<string, any>, pagination: any) => {
  const params: Record<string, any> = {
    page: pagination.page,
    count: pagination.count,
    filter: {},
  };

  if (filter.search) {
    params.filter.search = filter.search;
  }

  if (filter.dealIds) {
    const dealIds = filter.dealIds
      .split(",")
      .map((id: string) => id.trim())
      .filter(Boolean);
    if (dealIds.length > 0) {
      params.filter.dealRefId = { $in: dealIds };
    }
  }

  if (filter.brand && filter.brand.length > 0) {
    params.filter["applicableBrand.brandId"] = filter.brand[0]?.value?.id;
  }

  if (filter.category && filter.category.length > 0) {
    params.filter["applicableCategory.categoryId"] =
      filter.category[0]?.value?.id;
  }

  return params;
};
