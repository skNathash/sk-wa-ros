import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";

export const getMenus = async (type: string) => {
  if (type === "buyer") {
    const response = await SellerCatalogService.getMenus({
      page: 1,
      count: 100,
      parent: true,
      filter: { status: "Active", availableQuantity: { $gt: 0 } },
    });
    return SellerCatalogService.formatMenuResponse(response.data.data);
  } else {
    const { data } = await ProductService.getMenus();
    return data;
  }
};

export const getCategories = async (type: string, menuId: string) => {
  if (type === "buyer") {
    const response = await SellerCatalogService.getCategories({
      page: 1,
      count: 100,
      filter: {
        "applicableMenu.menuId": menuId,
        status: "Active",
        availableQuantity: { $gt: 0 },
      },
      groupbycond: "parentcategory",
      parent: true,
    });
    return SellerCatalogService.formatCategoryResponse(response.data.data);
  } else {
    const r = await ProductService.getSubCategories(menuId);
    return r.data;
  }
};
