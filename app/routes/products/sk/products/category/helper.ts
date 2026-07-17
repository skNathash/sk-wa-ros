import ProductService from "~/services/ProductService";
import type { CategoryItem } from "./components/CategoryListPanel";
import type { MenuItem } from "./components/MenuColumn";

const formatMenus = (menus: any[]): MenuItem[] =>
  (menus || []).map((menu) => ({
    _id: menu._id,
    name: menu.name,
    _displayName: menu._displayName || menu.name,
    _displayImg: menu.displayImg || menu._displayImg || "",
  }));

const formatCategories = (categories: any[]): CategoryItem[] =>
  (categories || []).map((category) => ({
    _id: category._id,
    name: category.name,
    _displayName: category._displayName || category.name,
    _displayImg: category.displayImg || category._displayImg || "",
    dealsCount: category.dealsCount,
  }));

/** Top-level menus (SK menus map to the top-level SPC categories). */
export const getMenus = async (): Promise<MenuItem[]> => {
  try {
    const response = await ProductService.getMenus();
    return formatMenus(response.data || []);
  } catch (error) {
    console.error("Error fetching SK menus:", error);
    return [];
  }
};

/** Child categories of the given menu. */
export const getCategories = async (menuId: string): Promise<CategoryItem[]> => {
  if (!menuId) return [];
  try {
    const response = await ProductService.getSubCategories(menuId);
    return formatCategories(response.data || []);
  } catch (error) {
    console.error("Error fetching SK categories:", error);
    return [];
  }
};
