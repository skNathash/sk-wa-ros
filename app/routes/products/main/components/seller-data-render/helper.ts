import { orderBy } from "lodash";
import SellerCatalogService from "~/services/SellerCatalogService";

const getCategories = async (menuId: string) => {
  const response = await SellerCatalogService.getCategories({
    filter: {
      "applicableMenu.menuId": menuId,
      status: "Active",
      availableQuantity: { $gt: 0 },
    },
    groupbycond: "parentcategory",
    parent: true,
    sort: "high-sales",
  });
  return {
    data: SellerCatalogService.formatCategoryResponse(
      response.data?.data || []
    ),
  };
};

const getProducts = async (menuId: string) => {
  const response = await SellerCatalogService.getProducts({
    page: 1,
    count: 20,
    parent: true,
    filter: {
      "applicableMenu.menuId": menuId,
      status: "Active",
      availableQuantity: { $gt: 0 },
    },
  });
  return {
    data: SellerCatalogService.formatProductResponse(response.data?.data || []),
  };
};

const getMenuData = async (menuId: string, menuName: string) => {
  const response = await Promise.all([
    getCategories(menuId),
    getProducts(menuId),
  ]);
  return {
    menu: {
      name: menuName,
      _id: menuId,
    },
    categories: response[0].data,
    products: response[1].data,
  };
};
export const getMenus = async () => {
  const response = await SellerCatalogService.getMenus({
    page: 1,
    count: 100,
    parent: true,
    filter: { status: "Active", availableQuantity: { $gt: 0 } },
  });

  const d = orderBy(response.data?.data || [], ["totalDeals"], ["desc"]);
  const formatted = SellerCatalogService.formatMenuResponse(d);
  return {
    data: formatted,
  };
};

export const getData = async (
  menuIds: Array<{ _id: string; name: string }>
) => {
  let promisses: Array<
    Promise<{
      menu: { name: string; _id: string };
      categories: any[];
      products: any[];
    }>
  > = [];

  menuIds.forEach(({ _id, name }) => {
    promisses.push(getMenuData(_id, name));
  });

  const response = await Promise.all(promisses);
  return response;
};
