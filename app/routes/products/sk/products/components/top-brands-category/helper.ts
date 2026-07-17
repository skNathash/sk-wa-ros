import ProductService from "~/services/ProductService";

export type TopSellingItem = {
  _id: string;
  name: string;
  _displayName: string;
  /** asset id used as the thumbnail */
  image?: string;
};

export type TopBrandsCategoryData = {
  brands: TopSellingItem[];
  categories: TopSellingItem[];
};

// The popular endpoints return { doc: [{ count, name, id, image: string[] }] }.
const formatItems = (raw: unknown): TopSellingItem[] =>
  (Array.isArray(raw) ? raw : [])
    .filter((item: any) => item?.id)
    .map((item: any) => ({
      _id: String(item.id),
      name: item.name ?? "",
      _displayName: item.name ?? "",
      image: item.image?.[0],
    }));

// AjaxService wraps the body as { data: <body> }; the list lives at body.doc.
const extractDoc = (response: any): unknown => response?.data?.doc ?? [];

/**
 * Fetches the popular brands and categories used by the right-side section of
 * the SK products pages.
 */
export const getTopBrandsAndCategories =
  async (): Promise<TopBrandsCategoryData> => {
    const [categoriesRes, brandsRes] = await Promise.all([
      ProductService.getPopularCategories(),
      ProductService.getPopularBrands(),
    ]);
    return {
      brands: formatItems(extractDoc(brandsRes)),
      categories: formatItems(extractDoc(categoriesRes)),
    };
  };
