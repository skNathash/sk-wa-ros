import type { AxiosRequestConfig } from "axios";
import { merge, orderBy } from "lodash";
import { API, API_VERSION, OLD_API } from "~/constants";
import type { Deal } from "~/types/CommonTypes";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import CartService from "./CartService";
import CommonService from "./CommonService";
import FranchiseService from "./FranchiseService";
import MiscService from "./MiscService";
import PurchaseBasketService from "./PurchaseBasketService";

interface GetProductsOptions {
  showPosInventory?: boolean;
  ignoreConnectedSeller?: boolean;
  includeRawResp?: boolean;
  signal?: AbortSignal;
}

/**
 * Service for Product related API calls
 */
export class ProductService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  private static formatProductResponse(
    data: any,
    options?: GetProductsOptions,
  ) {
    const mrp = data.mrp || 0;
    const price =
      data.sellers?.[0]?.b2bPrice || data.sellers?.[0]?.b2cPrice || 0;
    const discount =
      mrp > 0 ? CommonService.calculateDiscount(mrp, price, 0, "markup") : 0;
    const inCart = CartService.isDealInCart(data._id) || undefined;
    const inBasket =
      PurchaseBasketService.isDealInLocalBasket(data._id) || undefined;

    // Adjust stock based on perOrderLimit
    const stock = data.sellers?.[0]?.b2bQuantity || 0;
    const perOrderLimit = data.perOrderLimit || stock;
    let adjustedStock = perOrderLimit < stock ? perOrderLimit : stock;

    const selectedSeller = data.sellers?.[0] || null;
    const buyViaPurchaseBasket =
      AuthService.isBuyerUser() && selectedSeller?.id === "MPS0";

    const selectedLang = MiscService.getSelectedLang();

    let brand = data.brand?.[0];
    let category = data.category?.[0];

    if (brand?.name) {
      brand._displayName = brand?.lng?.[selectedLang] || brand?.name;
    }

    if (category?.name) {
      category._displayName = category?.lng?.[selectedLang] || category?.name;
    }

    const response: Deal = {
      fulfilledBy: data.sellers?.[0]?.id || "",
      name: data.name,
      selectedSeller: selectedSeller,
      maxQty: adjustedStock, // Updated maxQty value
      incrQty: data.sellers?.[0]?.incrementQuantity || 1,
      minQty: data.sellers?.[0]?.b2bMinQuantity || 1,
      mrp: mrp,
      price: price,
      displayPrice: price,
      discount: discount,
      images: data.images,
      id: data._id,
      _id: data._id,
      inventoryNew: data.inventoryNew,
      inCart: inCart,
      inBasket: inBasket,
      category: category,
      brand: brand,
      description: data.description,
      shortDescription: data.shortDescription,
      highlights: data.highlights,
      whId: data.whId,
      buyViaPurchaseBasket: buyViaPurchaseBasket,
      isSfToSf: AuthService.isBuyerUser(),
      product: data.product?.[0],
      // Default to showing other deals for product cards
      showOtherDeals: false,
      checkPrice: !data.sellers?.length,
      isOutOfStock: !data.acceptOrder,
    };

    if (data.isSlabBasedPricing && data.sellers?.[0]?.id == "MPS0") {
      const { slabs, price, discount } = this.preparePriceSlab(
        data.priceSlabs || [],
        response.maxQty,
        response.mrp,
      );
      response.priceSlabs = slabs;
      response.displayPrice = price;
      response.discount = discount;
    }

    if (options?.includeRawResp) {
      response._raw = data;
    }

    return response;
  }

  static preparePriceSlab(data: Array<any>, maxQty: number, mrp: number) {
    let slabs = [];
    let price = 0;
    let discount = 0;

    //preparing price slab
    if (data?.length > 0) {
      let s = (data || [])
        .filter((e: any) => {
          return e.min < maxQty ? true : false;
        })
        .map((e) => {
          e._offerPrice = CommonService.roundedByDecimalPlace(
            (e.price / e.mrp) * mrp,
            2,
          );
          e._discount = CommonService.calculateDiscount(
            mrp,
            e._offerPrice,
            0,
            "markup",
          );
          return e;
        });

      s = orderBy(s, "min");

      slabs = s;
      // OVERRWRITE THE PRICE SLAB PRICE TO ACTUAL B2B PRICE
      if (AuthService.isUserLoggedIn() && s.length > 0) {
        const psPrice = s[s.length - 1]._offerPrice;
        price = CommonService.roundedByDecimalPlace(psPrice, 2);
        discount = CommonService.calculateDiscount(mrp, price, 0, "markup");
      }
      return { slabs, price, discount };
    } else {
      return { slabs: [], price: 0, discount: 0 };
    }
  }

  /**
   * Get products data
   *
   * @param params - Query parameters for filtering products. Defaults to {filter: {status: 'Publish'}}
   * @returns Promise with products data
   */
  public static async getProducts(
    params: Record<string, any>,
    options?: GetProductsOptions,
  ) {
    const p: Record<string, any> = merge(
      {
        filter: {
          status: "Publish",
        },
        // Hide out-of-stock deals by default; callers can override per request.
        showOutOfStock: false,
      },
      params,
    );

    if (AuthService.isBuyerUser() && !options?.ignoreConnectedSeller) {
      p.showConnectedSellerStock = true;
      p.connectedSellerId = FranchiseService.getConnectedSellers()[0]?.id;
    }

    if (options?.showPosInventory) {
      p.showPOSInventory = true;
    }

    const response = await AjaxService.request(
      `${OLD_API}deal/${this.API_VERSION}`,
      "GET",
      p,
      options?.signal ? { signal: options.signal } : undefined,
    );

    if (Array.isArray(response.data)) {
      const formattedData = response.data.map((product: any) =>
        this.formatProductResponse(product, options),
      );
      let withStock = formattedData.filter(
        (product: any) => product.isOutOfStock,
      );
      let withoutStock = formattedData.filter(
        (product: any) => !product.isOutOfStock,
      );
      response.data = [...withStock, ...withoutStock];
    }

    return response;
  }

  public static async getProductCount(
    params?: Record<string, any>,
    options?: GetProductsOptions,
  ) {
    const p = merge(
      {
        filter: { status: "Publish" },
        select: "name",
      },
      params || {},
    );

    if (AuthService.isBuyerUser() && !options?.ignoreConnectedSeller) {
      p.showConnectedSellerStock = true;
      p.connectedSellerId = FranchiseService.getConnectedSellers()[0]?.id;
    }

    if (options?.showPosInventory) {
      p.showPOSInventory = true;
    }

    const response = await AjaxService.request(
      `${OLD_API}deal/${this.API_VERSION}/getDealRefinements`,
      "GET",
      p,
      options?.signal ? { signal: options.signal } : undefined,
    );
    return { count: response.data?.dealscount || 0 };
  }

  public static async getDealRefinement(params: Record<string, any>) {
    const p = merge(
      {
        filter: { status: "Publish" },
        select: "name",
      },
      params,
    );

    if (AuthService.isBuyerUser()) {
      p.showConnectedSellerStock = true;
      p.connectedSellerId = FranchiseService.getConnectedSellers()[0]?.id;
    }

    const response = await AjaxService.request(
      `${OLD_API}deal/${this.API_VERSION}/getDealRefinements`,
      "GET",
      p,
    );
    return response;
  }

  /**
   * Get menu data
   *
   * @returns Promise with menu data
   */
  static getMenus = async () => {
    const topCategories: string[] = ["C7340", "C6516"];
    const params = {
      page: 1,
      count: 100,
      select: "mainImages,kingclubMainImages,lng",
      categoryFilter: {
        _id: {
          $nin: ["C7582"],
        },
      },
    };
    const r = await this.getSpcCategories(params);

    const selectedLang = MiscService.getSelectedLang();

    // format the response
    const formattedResponse = Array.isArray(r.data)
      ? orderBy(r.data, ["dealsCount"], ["desc"]).map((x) => {
          let mImg = "";
          if (x.kingclubMainImages && x.kingclubMainImages.length > 0) {
            mImg = x.kingclubMainImages[0].image;
          } else if (x.mainImages && x.mainImages.length > 0) {
            mImg = x.mainImages[0];
          }

          x._displayName = x.lng?.[selectedLang] || x.name;

          return {
            ...x,
            displayImg: mImg,
          };
        })
      : [];

    // Forcefully show top categories at the beginning
    const topCategoriesData = formattedResponse.filter((menu) =>
      topCategories.includes(menu._id),
    );
    const otherCategoriesData = formattedResponse.filter(
      (menu) => !topCategories.includes(menu._id),
    );

    return {
      data: [...topCategoriesData, ...otherCategoriesData],
    };
  };

  public static async getSpcCategories(params: Record<string, any>) {
    const p = merge(
      {
        filter: {
          status: "Active",
        },
        categoryFilter: { status: "Active" },
      },
      params,
    );
    const response = await AjaxService.request(
      `${OLD_API}deal/${this.API_VERSION}/spc/categories`,
      "GET",
      p,
    );
    const selectedLang = MiscService.getSelectedLang();
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      response.data = response.data?.map((item: any) => ({
        ...item,
        _displayName: item?.lng?.[selectedLang] || item.name,
      }));
    }
    return response;
  }

  public static async getSpcBrands(apiParams?: any) {
    const defaultParams = {
      select: "name,image,url",
      filter: {
        status: "Active",
      },
      brandFilter: {
        status: "Active",
      },
    };
    const params = merge({}, defaultParams, apiParams || {});

    const response = await AjaxService.request(
      `${OLD_API}deal/${this.API_VERSION}/spc/brands`,
      "GET",
      params || {},
    );

    const selectedLang = MiscService.getSelectedLang();
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      response.data = response.data?.map((item: any) => {
        return {
          ...item,
          _displayName: item?.lng?.[selectedLang] || item.name,
        };
      });
    }

    return response;
  }

  public static async getCategoriesOld(params?: Record<string, any>) {
    const response = await AjaxService.request(
      `${OLD_API}category/${this.API_VERSION}`,
      "GET",
      params,
    );

    const selectedLang = MiscService.getSelectedLang();
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      response.data = response.data?.map((item: any) => {
        return {
          ...item,
          _displayName: item?.lng?.[selectedLang] || item.name,
        };
      });
    }

    return response;
  }

  public static async getCategoriesCountOld(params?: Record<string, any>) {
    return AjaxService.request(
      `${OLD_API}category/${this.API_VERSION}/count`,
      "GET",
      params,
    );
  }

  public static async getCategories(
    params?: Record<string, any>,
    config?: AxiosRequestConfig,
  ) {
    const response = await AjaxService.request(
      `${API}catalog/categories`,
      "GET",
      params,
      config,
    );

    if (response.statusCode === 200 && Array.isArray(response.data?.data)) {
      response.data = response.data?.data?.map((item: any) => ({
        _id: item.categoryId,
        name: item.name,
        id: item._id,
      }));
    }

    return response;
  }

  public static async getBrandsOld(params?: Record<string, any>) {
    const response = await AjaxService.request(
      `${OLD_API}brand/${this.API_VERSION}`,
      "GET",
      params,
    );

    const selectedLang = MiscService.getSelectedLang();
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      response.data = response.data?.map((item: any) => {
        return {
          ...item,
          _displayName: item.lng?.[selectedLang] || item.name,
        };
      });
    }

    return response;
  }

  public static async getBrandsCountOld(params?: Record<string, any>) {
    const response = await AjaxService.request(
      `${OLD_API}brand/${this.API_VERSION}/count`,
      "GET",
      params,
    );

    const selectedLang = MiscService.getSelectedLang();
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      response.data = response.data?.map((item: any) => {
        return {
          ...item,
          _displayName: item.lng?.[selectedLang] || item.name,
        };
      });
    }

    return response;
  }

  public static async getBrands(
    params?: Record<string, any>,
    options?: { useOldApi?: boolean },
    config?: AxiosRequestConfig,
  ) {
    if (options?.useOldApi) {
      return this.getBrandsOld(params);
    }

    const response = await AjaxService.request(
      `${API}catalog/brands`,
      "GET",
      params,
      config,
    );

    if (response.statusCode === 200 && Array.isArray(response.data?.data)) {
      response.data.data = response.data?.data?.map((item: any) => ({
        _id: item.brandId,
        name: item.name,
        id: item._id,
      }));
    }

    return response;
  }

  public static async getLastOrderDate(params?: Record<string, any>) {
    const response = await AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/getlastorderdate`,
      "GET",
      params || {},
    );
    return response;
  }

  /**
   * Get RSP (Retail Selling Price) change logs for a deal
   *
   * @param params - Query parameters including dealId and optional date filters
   * @returns Promise with price change logs data
   */
  public static async getRspLogs(params: Record<string, any> = {}) {
    const p = merge({}, params, {
      filter: {
        franchiseId: AuthService.getLoggedInUserId(),
        ...params.filter,
      },
    });

    const response = await AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/priceConfigLog`,
      "GET",
      p,
    );

    // Format the response to add reason for price change
    if (Array.isArray(response.data)) {
      response.data = response.data.map((log: any) => {
        let reason = "";
        if (
          log.oldData &&
          Object.keys(log.oldData).length &&
          log.newData &&
          Object.keys(log.newData).length
        ) {
          const oldData = log.oldData;
          const newData = log.newData;

          if (oldData.mrp !== newData.mrp) {
            reason = "MRP Changed";
          } else if (oldData.price !== newData.price) {
            reason = "Selling Price Changed";
          } else if (oldData.discount !== newData.discount) {
            reason = "Discount Changed";
          }
        }

        return {
          ...log,
          _reason: reason,
        };
      });
    }

    return response;
  }

  static getSubCategories = async (menuId: string) => {
    const r = await this.getSpcChildCategories(menuId, {
      fetchLinkedCategory: true,
      select: "kingclubImages,lng",
    });

    const selectedLang = MiscService.getSelectedLang();

    // format the response
    const formattedResponse = Array.isArray(r.data)
      ? r.data.map((n) => {
          let sImg = "";

          if (n.kingclubMainImages && n.kingclubMainImages.length > 0) {
            sImg = n.kingclubMainImages[0].image;
          } else if (n.kingclubImages && n.kingclubImages.length > 0) {
            sImg = n.kingclubImages[0].image;
          } else if (n.mainImages && n.mainImages.length > 0) {
            sImg = n.mainImages[0];
          }

          n._displayName = n.lng?.[selectedLang] || n.name;

          return {
            ...n,
            displayImg: sImg,
          };
        })
      : [];

    return { data: formattedResponse };
  };

  static async getSpcChildCategories(id: string, params: any = {}) {
    const p = merge(
      {},
      {
        page: 1,
        count: 100,
        dealFilter: {
          status: "Publish",
          isKCStoreEnabled: { $ne: true },
        },
        categoryFilter: { status: "Active", dealsCount: { $gt: 0 } },
      },
      params,
    );

    const r = await AjaxService.request(
      `${OLD_API}deal/${this.API_VERSION}` + "/spc/categories/" + id + "/child",
      "GET",
      p,
    );

    if (Array.isArray(r.data)) {
      const selectedLang = localStorage.getItem("lng") || "en";
      r.data = r.data.map((x) => {
        x._displayName = x.lng?.[selectedLang] || x.name;
        return x;
      });
    }

    return r;
  }

  static getSimilarDeals(params: any) {
    return this.getRecommendedDeals(params);
  }

  static async getRecommendedDeals(params: any) {
    const r = await AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/getRecommendDealIdsByConfig`,
      params,
    );
    if (Array.isArray(r.data) && r.data.length > 0) {
      const ids = r.data.map((e) => e._id);
      const dr = await this.getProducts({
        page: 1,
        count: ids.length,
        filter: { _id: { $in: ids } },
      });
      r.data = dr.data;
    } else {
      r.data = [];
    }
    return r;
  }

  static search(keyword: string) {
    return AjaxService.request(
      `${OLD_API}${this.API_VERSION}/keywordSearch`,
      "GET",
      {
        keyword,
      },
    );
  }

  static getDealBarcodes(dealIds: string[]) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/barcodes/list`,
      "POST",
      { dealIds },
    );
  }

  static async applyCoupon(params: any) {
    return AjaxService.request(
      `${OLD_API}oms/${this.API_VERSION}/order/cart/applyCoupon`,
      "POST",
      params,
    );
  }

  static async getCoupons(params: any) {
    return AjaxService.request(
      `${OLD_API}coupons/${this.API_VERSION}`,
      "GET",
      params,
    );
  }

  static async keywordSearchSuggestions(keyword: string) {
    return AjaxService.request(API + "/catalog/keywords-suggestions", "POST", {
      text: keyword,
    });
  }

  /**
   * Get the network top-selling items for a given resource (brands/categories),
   * scoped by the supplied params (e.g. nearest district).
   *
   * @param resource - "brands" or "categories"
   * @param params - Query parameters (e.g. { type: "nearMe", sortBy: "district" })
   */
  static async getTopSelling(
    resource: "brands" | "categories",
    params?: Record<string, any>,
  ) {
    const response = await AjaxService.request(
      `${OLD_API}oms/${this.API_VERSION}/topSelling/${resource}`,
      "GET",
      params || {},
    );
    return response;
  }

  static getTopSellingBrands(params?: Record<string, any>) {
    return this.getTopSelling("brands", params);
  }

  static getTopSellingCategories(params?: Record<string, any>) {
    return this.getTopSelling("categories", params);
  }

  /**
   * Get the popular brands used by the SK products top brands section.
   * Response shape: { doc: [{ count, name, id, image: string[] }] }
   */
  static async getPopularBrands(params?: Record<string, any>) {
    return AjaxService.request(
      `${OLD_API}oms/${this.API_VERSION}/getPopularBrands`,
      "GET",
      { page: 1, count: 20, ...params },
    );
  }

  /**
   * Get the popular categories used by the SK products categories section.
   * Response shape: { doc: [{ count, name, id, image: string[] }] }
   */
  static async getPopularCategories(params?: Record<string, any>) {
    return AjaxService.request(
      `${OLD_API}oms/${this.API_VERSION}/getPopularCategories`,
      "GET",
      { page: 1, count: 20, ...params },
    );
  }
}

export default ProductService;
