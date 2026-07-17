import CommonService from "~/services/CommonService";
import ProductService from "~/services/ProductService";
import type { PaginationState } from "~/types/CommonTypes";
import type { CategoryItem } from "../CategoryList";

export type CategoryFilter = {
  categoryIds?: string[];
  search?: string;
  alpha?: string;
};

/**
 * Resolve the category ids that have deals for the given brand. The SK catalog
 * does not expose a direct brand → category endpoint, so we derive it from the
 * deal refinements (same approach as the browse-by-brand page).
 */
export const getBrandCategoryIds = async (brandId: string) => {
  try {
    const response = await ProductService.getDealRefinement({
      filter: { brand: brandId },
      showColumns: ["category"],
    });
    return (response.data?.category || []) as string[];
  } catch (error) {
    console.error("Error fetching brand category ids:", error);
    return [];
  }
};

export const prepareParams = (
  filter: CategoryFilter,
  pagination: PaginationState,
): Record<string, any> => {
  const { categoryIds, search, alpha } = filter || {};

  const and: Record<string, any>[] = [];

  if (categoryIds && categoryIds.length) {
    and.push({ _id: { $in: categoryIds } });
  }

  if (search) {
    and.push({ name: { $regex: search.trim(), $options: "i" } });
  } else if (alpha) {
    and.push({ name: CommonService.prepareAlphaRegexFilter(alpha) });
  }

  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: "name",
  };

  if (and.length) {
    params.filter = { $and: and };
  }

  return params;
};

const formatCategories = (categories: any[]): CategoryItem[] =>
  (categories || []).map((category) => {
    let img = "";
    if (category.kingclubMainImages?.length) {
      img = category.kingclubMainImages[0].image;
    } else if (category.mainImages?.length) {
      img = category.mainImages[0];
    }

    return {
      _id: category._id,
      name: category.name,
      _displayName: category._displayName || category.name,
      _displayImg: img,
      dealsCount: category.dealsCount,
    };
  });

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await ProductService.getCategoriesOld(params);
    return formatCategories(response.data || []);
  } catch (error) {
    console.error("Error fetching SK brand categories:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };
  delete p.page;
  delete p.count;
  try {
    const response = await ProductService.getCategoriesCountOld(p);
    return response.data || 0;
  } catch (error) {
    console.error("Error fetching SK brand categories count:", error);
    return 0;
  }
};
