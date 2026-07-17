import type { AxiosRequestConfig } from "axios";
import { merge } from "lodash";
import {
  API,
  DEFAULT_BROWSE_DISTANCE,
  MOVEMENT_TYPE_EXPIRED_DESCRIPTION,
  MOVEMENT_TYPE_FAST_MOVING_DESCRIPTION,
  MOVEMENT_TYPE_NEAR_EXPIRY_DESCRIPTION,
  MOVEMENT_TYPE_NON_MOVING_DESCRIPTION,
  MOVEMENT_TYPE_NORMAL_DESCRIPTION,
  MOVEMENT_TYPE_SLOW_MOVING_DESCRIPTION,
} from "~/constants";
import CartService from "~/services/CartService";
import type {
  BreadcrumbItem,
  PackConfigItemType,
  SellerDeal,
  SellersArrayItem,
  SellingType,
  VariantColor,
} from "~/types/CommonTypes";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import CommonService from "./CommonService";
import MiscService from "./MiscService";
import UomPriceService from "~/services/UomPriceService";

class SellerCatalogService {
  static getMovementTypes(): {
    label: string;
    value: string;
    key: string;
    description?: string;
  }[] {
    const movementTypes = [
      {
        key: "fast-moving",
        label: "Fast Moving",
        value: "Fast Moving",
        description: MOVEMENT_TYPE_FAST_MOVING_DESCRIPTION,
        priority: 1,
      },
      {
        key: "normal",
        label: "Normal",
        value: "Normal",
        description: MOVEMENT_TYPE_NORMAL_DESCRIPTION,
      },
      {
        key: "slow-moving",
        label: "Slow Moving",
        value: "Slow Moving",
        description: MOVEMENT_TYPE_SLOW_MOVING_DESCRIPTION,
      },
      {
        key: "non-moving",
        label: "Non-Moving",
        value: "Non-Moving",
        description: MOVEMENT_TYPE_NON_MOVING_DESCRIPTION,
      },
    ];
    return movementTypes;
  }

  static getStockStatusTypes(): {
    label: string;
    value: string;
    key: string;
    description?: string;
  }[] {
    return [
      {
        key: "low-stock",
        label: "Low Stock",
        value: "Low Stock",
        description: "",
      },
      {
        key: "near-expiry",
        label: "Near Expiry",
        value: "Near Expiry",
        description: MOVEMENT_TYPE_NEAR_EXPIRY_DESCRIPTION,
      },
      {
        key: "expired",
        label: "Expired",
        value: "Expired",
        description: MOVEMENT_TYPE_EXPIRED_DESCRIPTION,
      },
      {
        key: "out-of-stock",
        label: "Out of Stock",
        value: "Out of Stock",
        description: "",
      },
    ];
  }

  static getSellingTypes(): {
    label: string;
    value: string;
    packType: string;
    langKey?: string;
    apiValue?: string;
    color?: VariantColor;
  }[] {
    return [
      {
        value: "UNIT",
        apiValue: "Unit",
        label: "Units",
        packType: "Unit",
        langKey: "sellInUnits",
        color: "light",
      },
      {
        value: "CASE",
        label: "Case",
        packType: "Case",
        langKey: "sellInCase",
        apiValue: "Case",
        color: "success",
      },
      {
        value: "INNER_CASE",
        label: "Inner Case",
        packType: "Inner Case",
        langKey: "sellInInnerCase",
        apiValue: "InnerCase",
        color: "warning",
      },
      {
        value: "LADI",
        label: "Ladi",
        packType: "Ladi",
        langKey: "sellInLadi",
        apiValue: "Ladi",
        color: "danger",
      },
    ];
  }

  /**
   * Returns the middle breadcrumb item for inventory/product-select flows
   * based on the provided `source` identifier.
   *
   * This centralises mappings so both product-select listings and their
   * cart pages stay in sync when navigating from different inventory views.
   */
  static getInventorySourceBreadcrumb(
    source?: string | null,
  ): BreadcrumbItem | null {
    if (!source) return null;

    if (source === "schemes") {
      return {
        label: "B2B Schemes",
        redirect: { path: "/configs/schemes" },
      };
    }

    if (source === "cases") {
      return {
        label: "Sell In Config",
        redirect: { path: "/dashboard/inventory/cases" },
      };
    }

    if (source === "missing-config") {
      return {
        label: "Missing Config Products",
        redirect: {
          path: "/dashboard/inventory/products/missing-config",
        },
      };
    }

    return null;
  }

  // Global sort options used across inventory/product listings
  static getGlobalSortOptions(): {
    label: string;
    value: string;
    langKey?: string;
  }[] {
    return [
      { label: "Sort By: Default", value: "all", langKey: "sortByDefault" },
      // { label: "Fast Moving", value: "fast-moving", langKey: "fastMoving" },
      // { label: "High Sales", value: "high-sales", langKey: "highSales" },
      // { label: "Non Moving", value: "non-moving", langKey: "nonMoving" },
      // { label: "Slow Moving", value: "slow-moving", langKey: "slowMoving" },
      {
        label: "Recently subscribed",
        value: "recently-subscribed",
        langKey: "recentlySubscribed",
      },
      {
        label: "Stock Quantity: High to Low",
        value: "high-stock",
        langKey: "stockQuantityHighToLow",
      },
      {
        label: "Stock Quantity: Low to High",
        value: "low-stock",
        langKey: "stockQuantityLowToHigh",
      },
      {
        label: "A-Z",
        value: "name-asc",
        langKey: "sortAZ",
      },
      {
        label: "Z-A",
        value: "name-desc",
        langKey: "sortZA",
      },
      {
        label: "Price: High to Low",
        value: "price-desc",
        langKey: "priceHighToLow",
      },
      {
        label: "Price: Low to High",
        value: "price-asc",
        langKey: "priceLowToHigh",
      },
      // { label: "High Margin", value: "high-margin", langKey: "highMargin" },
    ];
  }

  static async getProducts(
    params: Record<string, any>,
    options: { showOutOfStock?: boolean } = { showOutOfStock: false },
    config?: AxiosRequestConfig,
  ) {
    let p = {
      ...params,
    };
    // if (!options?.showOutOfStock) {
    //   p = merge({}, p, { filter: { availableQuantity: { $gt: 0 } } });
    // }
    if (AuthService.isManpowerLoggedIn()) {
      p.restrictToUserBrands = true;
    }
    return AjaxService.request(`${API}catalog/seller-deals`, "GET", p, config);
  }

  static async getProduct(dealId: string) {
    return AjaxService.request(`${API}catalog/seller-deals/${dealId}`, "GET");
  }

  /**
   * Request barcode print for a seller deal
   * payload example:
   * {
   *  sellerDealId: string,
   *  barcode: string,
   *  quantity: number,
   *  format: string
   * }
   */
  static async barcodePrint(payload: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/seller-deals/barcode-print`,
      "POST",
      payload,
    );
  }

  static async barcodePrintPreview(payload: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/seller-deals/barcode-print?type=preview`,
      "POST",
      payload,
    );
  }

  static barcodeDownloadUrl(fileName: string) {
    return `${API}catalog/seller-deals/barcode/download/${fileName}`;
  }

  static barcodeAbsoluteUrl(urlOrPath: string) {
    if (!urlOrPath) return urlOrPath;
    if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
    const base = `${API}catalog`.replace(/\/$/, "");
    const path = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
    return `${base}${path}`;
  }

  static async getCategories(
    params: Record<string, any>,
    config?: AxiosRequestConfig,
  ) {
    const p = {
      ...params,
      groupbycond: "category",
    };
    return this.getProducts(p, {}, config);
  }

  static async getCompanies(params: Record<string, any>) {
    const p = {
      ...params,
      groupbycond: "companyName",
    };
    return this.getProducts(p);
  }

  static async getBrands(
    params: Record<string, any>,
    config?: AxiosRequestConfig,
  ) {
    const p = {
      ...params,
      groupbycond: "brand",
    };
    return this.getProducts(p, {}, config);
  }

  static async getMenus(
    params: Record<string, any>,
    config?: AxiosRequestConfig,
  ) {
    const p = {
      ...params,
      groupbycond: "menu",
    };
    return this.getProducts(p, {}, config);
  }

  static convertUnitsToPackQty(units: number, packQty: number) {
    return Math.floor(units / (packQty || 1));
  }

  static preparePackConfig(packConfig: PackConfigItemType[], stock: number) {
    let sellingType = "UNIT";
    let sellingTypeColor: VariantColor = "light";
    let maxQty = stock;

    const defaultPack = packConfig.find((p: any) => p.isDefault) || null;

    const stOptions = this.getSellingTypes();
    const stFound = stOptions.find(
      (st: any) => st.apiValue === defaultPack?.packType,
    );

    if (stFound) {
      sellingType = stFound.value;
      sellingTypeColor = stFound.color as VariantColor;
      maxQty = Math.floor(stock / (defaultPack?.quantity || 1));
    }

    // if (maxQty <= 0 && defaultPack?.allowCaseQtyOverride === true) {
    //   sellingType = "UNIT";
    //   sellingTypeColor = "light";
    //   maxQty = stock;
    // }

    return {
      sellingType: sellingType as SellingType,
      maxQty,
      actualMaxQty: stock,
      sellingTypeColor,
      packageQty: defaultPack?.quantity || 1,
      overridePackQtyOnLowStock: defaultPack?.allowCaseQtyOverride === true,
    };
  }

  /**
   * Formats the product response to the required structure
   * @param products - Array of product objects from API
   * @returns Array of formatted products with name, _id, images, mrp, price, stock
   */
  static formatProductResponse(
    products: any[],
    options?: {
      ignoreGroupDeals?: boolean;
      priceSlabFormatType?: "b2b" | "b2c";
      includeRawResponse?: boolean;
      ignoreCaseStock?: boolean;
      view?: "buyer" | "seller";
      excludeReserveStock?: boolean;
    },
  ): (SellerDeal & { _raw?: any })[] {
    return (products || []).map((product) => {
      // Determine movement type color based on movement type
      const getMovementTypeColor = (movementType: string): VariantColor => {
        switch (movementType?.toLowerCase()) {
          case "fast moving":
            return "success";
          case "slow moving":
            return "warning";
          case "normal":
            return "primary";
          case "non-moving":
            return "danger";
          default:
            return "light";
        }
      };

      const groupDealData = product.groupDeal
        ? CommonService.formatGroupDealData(
            product.dealId,
            {
              name: product.groupDeal.csa,
              groupedDeals: product.groupDeal?.groupDealInfo,
            },
            options?.ignoreGroupDeals || false,
          )
        : [];

      const brand = product.applicableBrand || {};
      const category = product.applicableCategory || {};
      const menu = product.applicableMenu || {};

      let maxStock = product.availableQuantity || 0;
      let actualMaxStock = maxStock;

      if (
        options?.view === "buyer" &&
        !options?.excludeReserveStock &&
        product.reserveConfig?.isActive
      ) {
        const reserveQty = product.reserveConfig?.maxReserveQty || 0;
        maxStock = maxStock + reserveQty;
        actualMaxStock = maxStock;
      }

      let packConfig: any = null;
      if (!options?.ignoreCaseStock) {
        packConfig = this.preparePackConfig(product.packConfig || [], maxStock);
        if (
          options?.view === "buyer" &&
          packConfig.maxQty <= 0 &&
          packConfig.overridePackQtyOnLowStock === true
        ) {
          packConfig.sellingType = "UNIT";
          packConfig.sellingTypeColor = "light";
          packConfig.maxQty = maxStock;
        }
        maxStock = packConfig.maxQty;
      }

      let consumerOffer = {
        enabled: product.isConsumerOffer ? true : false,
        title: product.consumerOfferData || "",
      };

      const selectedLang = MiscService.getSelectedLang();

      const networkPriceSlab = this.formatPriceSlab(product.networkPriceSlab);
      const customerPriceSlab = this.formatPriceSlab(product.customerPriceSlab);

      // prepare price slabs based on format type
      let priceSlabs = [];
      let priceSlabType = "";
      if (options?.priceSlabFormatType === "b2b") {
        priceSlabs = networkPriceSlab?.slab || [];
        priceSlabType = product?.networkPriceSlab?.configType || "";
      } else if (options?.priceSlabFormatType === "b2c") {
        priceSlabs = customerPriceSlab?.slab || [];
        priceSlabType = product?.customerPriceSlab?.configType || "";
      } else {
        priceSlabs = networkPriceSlab?.slab || [];
        priceSlabType = product?.networkPriceSlab?.configType || "";
      }

      if (priceSlabs.length > 0) {
        priceSlabs = priceSlabs.sort((a: any, b: any) => a.min - b.min);
      }

      let price = product.price || product.mrp || 0;
      let displayPrice = price;

      const inCart = CartService.isDealInCart(product.dealRefId) || {
        status: false,
        qty: 0,
      };

      if (inCart.status && typeof inCart.qty === "number" && inCart.qty > 0) {
        displayPrice = CommonService.getPriceFromSlab(
          { isAvailable: true, slab: priceSlabs },
          inCart.qty,
          price,
        );
      }

      const { youtubeLink, instaLink } =
        this.prepareSocialMediaLinks(product);

      let temp: SellerDeal & { _raw?: any } = {
        subscribedBy: product.subscribedBy || {},
        companyName: product.companyName || "",
        name: product.dealName,
        description: product.description || "",
        _id: product.dealId,
        id: product.dealRefId,
        images: product.images || [],
        mrp: product.mrp || 0,
        price: price,
        displayPrice: displayPrice,
        maxQty: maxStock,
        actualMaxQty: actualMaxStock,
        brand: {
          _id: brand?.brandId || "",
          name: brand?.brandName || "",
          id: brand?.id || "",
          _displayName: brand?.lng?.[selectedLang] || brand?.brandName || "",
        },
        category: {
          _id: category?.categoryId || "",
          name: category?.categoryName || "",
          id: category?.id || "",
          _displayName:
            category?.lng?.[selectedLang] || category?.categoryName || "",
        },
        menu: {
          _id: menu?.menuId || "",
          name: menu?.menuName || "",
          id: menu?.id || "",
          _displayName: menu?.lng?.[selectedLang] || menu?.menuName || "",
        },
        discount: CommonService.calculateDiscount(
          product.mrp,
          price,
          0,
          "markup",
        ),
        poStatus: product.poStatus || "",
        status: product.status || "",
        selectedSeller: {
          name: product.sellerName || "",
        },
        incrQty: product.incrQty || 0,
        minQty: product.minQty || 0,
        inCart,
        inventoryNew: product.inventoryNew || 0,
        fulfilledBy: product.fulfilledBy || "",
        velocity: product.velocity || "",
        locations: product.locations || [],
        _raw: product,
        inventoryValue: product.inventoryValue || 0,
        movementType: product.movementType || "Normal",
        _movementTypeColor: getMovementTypeColor(product.movementType),
        barcodes: product.barcodes || [],
        purchasePrice: product.purchaseInfo?.price || product.mrp || 0,
        b2bPrice: product?.networkSellingPrice?.price || 0,
        b2cPrice: product?.customerSellingPrice?.price || 0,
        b2bDiscount: product?.networkSellingPrice?.discount || 0,
        b2cDiscount: product?.customerSellingPrice?.discount || 0,
        b2cDiscountType:
          product?.customerSellingPrice?.discountType || "Normal",
        b2bDiscountType: product?.networkSellingPrice?.discountType || "Normal",
        isB2bMarginConfigured:
          product?.networkSellingPrice?.price != null &&
          product?.networkSellingPrice?.price !== product?.mrp,
        priceChangeHistory: product.priceChangeHistory || [],
        purchaseInfo: product.purchaseInfo || undefined,
        openPoAnalytics: product.openPoAnalytics || {
          openPos: [],
          totalOpenPos: 0,
          totalPendingQuantity: 0,
          totalPendingValue: 0,
        },
        // Shelf Life Information
        shelfLifeInfo: product.shelfLifeInfo || {
          expiryDate: null,
          remainingShelfLifeDays: null,
          isNearExpiry: false,
          nearExpiryThreshold: 30,
          lastCalculated: null,
        },
        // Sales Information
        customerSalesInfo: product.customerSalesInfo || {
          salesHistory: [],
        },
        networkSalesInfo: product.networkSalesInfo || {
          overAllQuantity: 0,
          salesHistory: [],
        },
        blockedQty: product.blockedQuantity || product.blockedQty || 0,
        pickedQty: product.pickedQuantity || 0,
        salesAnalytics: product?.salesAnalytics || {
          last7Days: { quantity: 0, value: 0 },
          last15Days: { quantity: 0, value: 0 },
          last30Days: { quantity: 0, value: 0 },
          last45Days: { quantity: 0, value: 0 },
          last60Days: { quantity: 0, value: 0 },
          last90Days: { quantity: 0, value: 0 },
        },
        totalSales: {
          value: product?.networkSalesInfo?.totalSalesValue,
          quantity: product?.networkSalesInfo?.totalSales || 0,
        },
        totalStock: product?.quantity || 0,
        basePrice:
          product?.networkSellingPrice?.basePrice ||
          product?.purchaseInfo?.price ||
          product.mrp ||
          0,
        isOutOfStock: maxStock == 0,
        consumerOffer: consumerOffer,
        hsn: product.hsn || "",
        gst: product.tax || 0,
        additionalCess: product?.additionalCess || 0,
        sellers: this.prepareSellersData(product.sellers || [], {
          view: options?.view,
        }),
        groupDeals: groupDealData,
        networkPriceSlab,
        customerPriceSlab,
        priceSlabs,
        priceSlabType,
        // KC Store related flags and info
        isKCStoreEnabled: product.isKCStoreEnabled || false,
        isReserve: product.reserveConfig?.isActive || false,
        isPromotionalDeal: product.isPromotionalDeal || false,
        isLocalDeal: product.isLocalDeal || false,
        sellerSocialMediaLinks: Array.isArray(product.sellerSocialMediaLinks)
          ? product.sellerSocialMediaLinks
          : [],
        dealSocialMediaLinks: Array.isArray(product.dealSocialMediaLinks)
          ? product.dealSocialMediaLinks
          : [],
        youtubeLink,
        instaLink,
        kcStoreInfo: product.kcStoreInfo || undefined,
        sellingType: packConfig?.sellingType || "UNIT",
        sellingTypeColor:
          (packConfig?.sellingTypeColor as VariantColor) || "light",
        packageQty: packConfig?.packageQty || 1,
        selectedStockUom:
          product.selectedStockUom === "piece"
            ? "unit"
            : product.selectedStockUom || "",
        // Pack/unit configuration cannot be edited for small (loose) UOMs like gm/ml
        hideUnitConfigEdit: UomPriceService.isSmallUom(
          product.selectedStockUom,
        ),
        overridePackQtyOnLowStock:
          packConfig?.overridePackQtyOnLowStock || false,
        b2bScheme: this.prepareSchemeData(
          product?.networkSellingPrice?.offerOfTheDay || {},
        ),
        partnerOnlinePrices: (product.partnerOnlinePrices || []).filter(
          (p: { name?: string }) =>
            ["amazon", "flipkart", "other"].includes(
              (p?.name || "").trim().toLowerCase(),
            ),
        ),
        partnerPriceData: this.buildPartnerPriceData(
          product.partnerOnlinePrices || [],
        ),
      };

      if (options?.includeRawResponse) {
        temp._raw = product;
      }

      return temp;
    });
  }

  /**
   * Collapses the raw `partnerOnlinePrices` feed into a fixed shape the price
   * table can read directly: Amazon, Flipkart and Other as named slots, every
   * other marketplace under `others`. `isLowest` flags the cheapest active price
   * across the whole set (only meaningful when more than one competitor exists).
   */
  /**
   * Build the youtube/instagram link arrays for a product.
   * Seller-configured links take priority; when the seller has none, the
   * deal-level links are used as a fallback.
   */
  static prepareSocialMediaLinks(product: {
    sellerSocialMediaLinks?: { name?: string; url?: string; link?: string }[];
    dealSocialMediaLinks?: { name?: string; url?: string; link?: string }[];
  }) {
    const sellerLinks = Array.isArray(product?.sellerSocialMediaLinks)
      ? product.sellerSocialMediaLinks
      : [];
    const dealLinks = Array.isArray(product?.dealSocialMediaLinks)
      ? product.dealSocialMediaLinks
      : [];

    const normalize = (l: { name?: string; url?: string; link?: string }) => ({
      name: l?.name || "",
      link: l?.url || l?.link || "",
    });

    const isYoutube = (l: { name?: string }) =>
      l?.name?.toLowerCase() === "youtube";

    const isInsta = (l: { name?: string }) => {
      const name = l?.name?.toLowerCase();
      return name === "instagram" || name === "insta";
    };

    // For each platform, prefer the seller-configured link; fall back to the
    // deal-level link only when the seller has none for that platform.
    const pickBy = (predicate: (l: { name?: string }) => boolean) => {
      const fromSeller = sellerLinks.filter(predicate);
      const links = fromSeller.length > 0 ? fromSeller : dealLinks.filter(predicate);
      return links.map(normalize);
    };

    const youtubeLink = pickBy(isYoutube);
    const instaLink = pickBy(isInsta);

    return { youtubeLink, instaLink };
  }

  static buildPartnerPriceData(partnerOnlinePrices: any[] = []) {
    const valid = partnerOnlinePrices || [];
    // .filter(
    //   (p) => p?.isActive !== false && Number(p?.price) > 0,
    // );

    const lowest = valid.length
      ? Math.min(...valid.map((p) => Number(p.price)))
      : 0;

    const toEntry = (p: any) => ({
      price: Number(p.price),
      isLowest: valid.length > 1 && Number(p.price) === lowest,
      url: p?.productUrl || undefined,
    });

    const byName = (target: string) =>
      valid.find((p) => (p?.name || "").trim().toLowerCase() === target);

    const amazon = byName("amazon");
    const flipkart = byName("flipkart");
    const other = byName("other");

    const others = valid
      .filter((p) => {
        const name = (p?.name || "").trim().toLowerCase();
        return name !== "amazon" && name !== "flipkart" && name !== "other";
      })
      .map((p) => ({ name: p.name, ...toEntry(p) }));

    return {
      amazon: amazon ? toEntry(amazon) : null,
      flipkart: flipkart ? toEntry(flipkart) : null,
      other: other ? toEntry(other) : null,
      others,
    };
  }

  static prepareSchemeData(scheme: {
    isOfferOfTheDay?: boolean;
    isDefaultOffer?: boolean;
    offerStartDate?: string | null;
    offerEndDate?: string | null;
    offerDiscount?: number;
    isTaxInclusive?: boolean;
  }) {
    // Determine status and color based on dates regardless of isOfferOfTheDay
    let status = "None";
    let statusColor: VariantColor = "light";
    let expired = false;

    try {
      const now = new Date();
      const startDate = scheme.offerStartDate
        ? new Date(scheme.offerStartDate)
        : null;
      const endDate = scheme.offerEndDate
        ? new Date(scheme.offerEndDate)
        : null;

      if (startDate && endDate) {
        if (startDate <= now && endDate >= now) {
          status = "Running";
          statusColor = "success";
        } else if (startDate > now) {
          status = "Upcoming";
          statusColor = "warning";
        } else if (endDate < now) {
          status = "Completed";
          statusColor = "danger";
        }
      }

      // If it's explicitly marked as offer of the day but dates are not provided,
      // keep the existing behaviour and mark as Running when applicable.
      if (scheme.isOfferOfTheDay && status === "None") {
        status = "Running";
        statusColor = "success";
      }
    } catch (e) {
      // fallback: keep defaults
    }

    return {
      ...scheme,
      status,
      statusColor,
      isTaxInclusive: scheme.isTaxInclusive || false,
    };
  }

  static formatPriceSlab(slabPayload: any) {
    const slabArr = (slabPayload?.slab || []).map((s: any) => ({
      min: s.minQuantity ?? 0,
      max: s.maxQuantity ?? 0,
      offerPrice: s.calculatedPrice ?? s.offerPrice ?? 0,
      discount: s.discountPercentage ?? s.discount ?? 0,
    }));

    return {
      isAvailable: slabPayload?.isActive && !!(slabArr && slabArr.length),
      slab: slabPayload?.isActive ? slabArr : [],
      configId: slabPayload?.configId ?? null,
    };
  }

  static prepareSellersData(
    sellers: Array<Record<string, any>>,
    options?: {
      view?: "buyer" | "seller";
    },
  ): SellersArrayItem[] {
    let formattedSellers = (sellers || []).map((seller: any) => {
      const packConfig = this.preparePackConfig(
        seller.packConfig || [],
        seller.availableQuantity,
      );

      let maxQty = seller.availableQuantity;
      let actualMaxQty = seller.availableQuantity;

      if (packConfig.sellingType !== "UNIT") {
        maxQty = packConfig.maxQty;
        actualMaxQty = packConfig.actualMaxQty;
      }

      if (
        options?.view === "buyer" &&
        packConfig.maxQty <= 0 &&
        packConfig.overridePackQtyOnLowStock === true
      ) {
        packConfig.sellingType = "UNIT";
        packConfig.sellingTypeColor = "light";
        maxQty = seller.availableQuantity;
        actualMaxQty = seller.availableQuantity;
      }

      return {
        packageQty: packConfig.packageQty,
        sellingType: packConfig.sellingType,
        priceSlab: this.formatPriceSlab(seller.networkPriceSlab),
        price: seller.networkSellingPrice ?? 0,
        networkBasePrice: seller.networkBasePrice ?? 0,
        b2bScheme: this.prepareSchemeData(seller?._offerInfo || {}),
        qty: maxQty,
        actualMaxQty: actualMaxQty,
        name: seller.sellerName,
        id: seller.sellerId,
        refId: seller.sellerRefId,
        mrp: seller.mrp,
        distance: seller.distance,
        isSkSeller: seller.networkType === "SK",
        isServiceable: seller.isServiceable,
        discountPercentage: CommonService.calculateDiscount(
          seller.mrp,
          seller.networkSellingPrice,
          0,
          "markup",
        ),
        cartQuantity: seller.cartQuantity || 0,
        cartId: seller.cartId,
        itemId: seller.itemId,
        city: seller.city || undefined,
        district: seller.district || undefined,
        pincode: seller.pincode || undefined,
      };
    });

    let skSellers = formattedSellers.filter((s) => s.isSkSeller === true);
    let otherSellers = formattedSellers.filter((s) => s.isSkSeller !== true);

    return [...skSellers, ...otherSellers];
  }

  /**
   * Calculate how many full "packages" can be formed from available stock.
   * Returns the number of complete packages that can be formed (floor division).
   */
  static calculatePackageCount(
    stock: number,
    packageQty?: number | null,
  ): number {
    const s = Number(stock) || 0;
    const c = Number(packageQty) || 0;

    if (c > 0) return Math.floor(s / c);

    return 0;
  }

  static formatMenuResponse(menus: any[]) {
    const selectedLang = MiscService.getSelectedLang();
    return (menus || []).map((menu) => ({
      name: menu._id?.menuName,
      _id: menu._id?.menuId,
      _displayImg: menu?._id?.images?.[0]?.image || "",
      _displayName: menu?.lng?.[selectedLang] || menu?._id?.menuName,
      id: menu._id,
      objId: menu?._id?.id,
    }));
  }

  static formatCategoryResponse(categories: any[], includeRawResponse = false) {
    const selectedLang = MiscService.getSelectedLang();
    return (categories || []).map((category) => ({
      name: category._id?.categoryName,
      _id: category._id?.categoryId,
      _displayImg: category?._id?.images?.[0]?.image || "",
      _displayName:
        category?.lng?.[selectedLang] || category?._id?.categoryName,
      id: category.categoryObjectId,
      objId: category?._id?.id,
      dealsCount: category.totalDeals || 0,
      ...(includeRawResponse && { _raw: category }),
    }));
  }

  static formatParentCategoryResponse(
    parentCategories: any[],
    includeRawResponse = false,
  ) {
    const selectedLang = MiscService.getSelectedLang();
    return (parentCategories || []).map((parentCategory) => ({
      name: parentCategory._id?.parentCategoryName,
      _id: parentCategory._id?.parentCategoryId,
      _displayImg: parentCategory?._id?.images?.[0]?.image || "",
      _displayName:
        parentCategory?.lng?.[selectedLang] ||
        parentCategory?._id?.parentCategoryName,
      id: parentCategory.parentCategoryObjectId,
      dealsCount: parentCategory.totalDeals || 0,
      ...(includeRawResponse && { _raw: parentCategory }),
    }));
  }

  static formatCompanyResponse(companies: any[], includeRawResponse = false) {
    return (companies || []).map((company) => ({
      name: company._id?.companyName,
      _id: company._id?.companyName || "",
      _displayImg: company?._id?.images?.[0]?.image || "",
      _displayName: company?._id?.companyName,
      id: company._id?.companyName || "",
      dealsCount: company.totalDeals || 0,
      ...(includeRawResponse && { _raw: company }),
    }));
  }

  static formatBrandResponse(brands: any[], includeRawResponse = false) {
    const selectedLang = MiscService.getSelectedLang();
    return (brands || []).map((brand) => ({
      name: brand._id?.brandName,
      _id: brand._id?.brandId,
      id: brand._id?.id,
      objId: brand.brandObjectId || brand._id?.id,
      _displayImg: brand?._id?.images?.[0] || "",
      _displayName: brand?.lng?.[selectedLang] || brand?._id?.brandName,
      dealsCount: brand.totalDeals || 0,
      ...(includeRawResponse && { _raw: brand }),
    }));
  }

  static async getSellerDealsAnalytics(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/seller-deals/analytics`,
      "GET",
      params,
    );
  }

  static async getReserveConfig(params?: Record<string, any>) {
    return AjaxService.request(`${API}catalog/reserve-config`, "GET", params);
  }

  static async updateReserveConfig(data: {
    configType: string;
    dealId?: string;
    isActive: boolean;
    maxReserveQty?: number;
    remarks?: string;
  }) {
    return AjaxService.request(`${API}catalog/reserve-config`, "POST", data);
  }

  /** Re-sync competitor/marketplace prices for a deal. */
  static async refreshOnlinePrices(dealId: string) {
    return AjaxService.request(
      `${API}catalog/catalog-online-prices/${dealId}/refresh`,
      "POST",
      {
        type: "fetchByUrl",
      },
    );
  }

  static async updatePromotionalDeal(
    dealId: string,
    isPromotionalDeal: boolean,
  ) {
    return AjaxService.request(`${API}catalog/seller-deals/${dealId}`, "PUT", {
      isPromotionalDeal,
    });
  }

  /**
   * Replace the seller-configured social media links (YouTube, Instagram, ...)
   * for a deal. Sends the full desired set — omitted platforms are cleared.
   */
  static async updateSocialMediaLinks(
    dealId: string,
    sellerSocialMediaLinks: { name: string; link: string }[],
  ) {
    return AjaxService.request(
      `${API}catalog/seller-deals/${dealId}/social-media-links`,
      "PUT",
      { sellerSocialMediaLinks },
    );
  }

  static async updateCartItemPrice(data: {
    cartId: string;
    dealId: string;
    overridePrice: number;
  }) {
    return AjaxService.request(`${API}sales/cart/item/price`, "POST", data);
  }

  static async removeCartItemPriceOverride(data: {
    cartId: string;
    dealId: string;
  }) {
    return AjaxService.request(`${API}sales/cart/item/price`, "POST", {
      ...data,
      removeOverride: true,
    });
  }

  static async getInventoryAnalytics(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/seller-deals/analytics`,
      "GET",
      params,
    );
  }

  static async addStocksInventory(data: Record<string, any>) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/add-stocks-inventory`,
      "POST",
      data,
    );
  }

  static calculatePnL(
    type: "network" | "customer",
    price: number,
    purchasePrice: number,
  ) {
    let profit = price - purchasePrice;

    if (type === "customer") {
      profit = purchasePrice - price;
    }

    return {
      profit,
      isProfitable: profit > 0,
      percentage: (profit / purchasePrice) * 100,
    };
  }

  static async getVendorWiseOrderHistory(
    dealId: string,
    params?: Record<string, any>,
  ) {
    return AjaxService.request(
      `${API}purchase/orders/vendor-wise-history/${dealId}`,
      "GET",
      params,
    );
  }

  static async getDealActivityLog(dealId: string) {
    return AjaxService.request(
      `${API}catalog/seller-deals/${dealId}/activity-logs`,
      "GET",
    );
  }

  static downloadProducts(params?: Record<string, any>) {
    // const baseUrl = `${API}catalog/csv/franchise/${AuthService.getLoggedInUserId()}/deals/export`;
    const baseUrl = `${API}inventory/csv/franchise/${AuthService.getLoggedInUserId()}/stockmaster-with-deals/export`;

    let url = baseUrl;

    try {
      if (params && Object.keys(params).length > 0) {
        const prepared = AjaxService.prepareParams(params);

        const searchParams = new URLSearchParams();
        Object.keys(prepared).forEach((k) => {
          const v = prepared[k];
          if (v !== null && v !== undefined) {
            searchParams.append(k, String(v));
          }
        });

        const qs = searchParams.toString();
        if (qs) {
          url = `${baseUrl}?${qs}`;
        }
      }
    } catch (e) {
      // If anything goes wrong while preparing query params, fall back to base URL
      url = baseUrl;
    }

    CommonService.windowOpenHandler(url, () => {});
  }

  static async updateProductStatus(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/seller-deals/${id}/status`,
      "PATCH",
      params,
    );
  }

  /**
   * Search multiple barcodes in bulk and return matching deals.
   * @param barcodes - array of barcode strings
   */
  static bulkBarcodeSearch(barcodes: string[]) {
    const payload = { barcodes };
    return AjaxService.request(
      `${API}catalog/deals/bulk-barcode-search`,
      "POST",
      payload,
    );
  }

  static bulkDealIdSearch(dealIds: string[]) {
    return AjaxService.request(
      `${API}catalog/deals/bulk-barcode-search`,
      "POST",
      { dealIds, type: "deal" },
    );
  }

  /**
   * Search multiple barcodes with quantities in bulk.
   */
  static bulkBarcodeSearchWithQty(
    barcodesWithQty: { barcode: string; qty: number }[],
  ) {
    const payload = { barcodesWithQty };
    return AjaxService.request(
      `${API}catalog/deals/bulk-barcode-search`,
      "POST",
      payload,
    );
  }

  static downloadTempFile(fileName: string) {
    return `${API}catalog/seller-deals/temp/${fileName}`;
  }

  static async getKcStoreDeals(params: any, includeRawResp = false) {
    const p: any = merge({}, params);
    p.filter = merge({}, p.filter);

    const r = await AjaxService.request(
      API + "/catalog/kcstore-deals/fetch",
      "GET",
      p,
    );

    // Use kcStoreInfo present on each deal (no separate kc config call required)
    if (r.statusCode == 200 && Array.isArray(r.data?.data)) {
      r.data.data = r.data.data.map((n: any) => {
        const formatted: Record<string, any> = this.formatProductResponse([
          {
            ...n,
            dealId: n._id,
            dealRefId: n.dealId,
            dealName: n.name,
          },
        ])[0];

        // Prefer the kcStoreInfo present on the deal payload
        const kc = n.kcStoreInfo || formatted.kcStoreInfo || {};
        formatted.kcStoreInfo = { ...(formatted.kcStoreInfo || {}), ...kc };

        // Ensure hasBuyAccess is a boolean (default false)
        formatted.kcStoreInfo.hasBuyAccess =
          typeof kc.hasBuyAccess === "boolean"
            ? kc.hasBuyAccess
            : !!kc.hasBuyAccess;

        // Ensure priceInfo exists and derive requiredKingCoins
        formatted.kcStoreInfo.requiredKingCoins =
          formatted.kcStoreInfo.priceInfo?.customer?.kingCoins || 0;

        // keep raw kc payload for debugging
        formatted.kcStoreInfo._kcRaw = kc;

        return formatted;
      });
    }

    return r;
  }

  static async getBusinessLinkedMenus(primaryId: string, secondaryId?: string) {
    let menuIds = [];

    const m1Resp = await CommonService.getBusinessCategoryDetails(primaryId);
    if (
      m1Resp.statusCode == 200 &&
      Array.isArray(m1Resp.data?.data?.linkedMenus)
    ) {
      menuIds = m1Resp.data.data.linkedMenus.map((item: any) => item._id);
    }

    if (secondaryId) {
      const m2Resp =
        await CommonService.getBusinessCategoryDetails(secondaryId);
      if (
        m2Resp.statusCode == 200 &&
        Array.isArray(m2Resp.data?.data?.linkedMenus)
      ) {
        menuIds.push(
          ...m2Resp.data.data.linkedMenus.map((item: any) => item._id),
        );
      }
    }

    return {
      ids: menuIds,
      status: menuIds.length > 0 ? "success" : "error",
    };
  }

  static getRecommendNetworkMyLowStockParams(params: Record<string, any>) {
    return {
      ...params,
      recommended: true,
      recommendedType: { stockStatus: ["LowStock"] },
    };
  }

  static getRecommendNetworkMyOutofStockParams(params: Record<string, any>) {
    return {
      ...params,
      recommended: true,
      recommendedType: { stockStatus: ["OutofStock"] },
    };
  }

  static getNetworkNewlyLaunchedParams(params: Record<string, any>) {
    return {
      ...params,
      recommended: true,
      recommendedType: { tags: ["NewlyLaunched"] },
    };
  }

  static getNetworkTopSellingParams(params: Record<string, any>) {
    return {
      ...params,
      recommended: true,
      recommendedType: { tags: ["TopSelling"] },
    };
  }

  static getNetworkPromotionalDealParams(params: Record<string, any>) {
    return {
      ...params,
      recommended: true,
      recommendedType: { tags: ["PromotionalDeal"] },
    };
  }

  static async getPromotionalDeal(
    params: Record<string, any>,
    distance: any = 10,
  ) {
    const p = this.getNetworkPromotionalDealParams(params);
    return this.getNetworkDeals(p, distance);
  }

  static async getNetworkDeals(
    params: Record<string, any>,
    distance: any = 10,
    options: {
      showOutOfStock?: boolean;
    } = {
      showOutOfStock: false,
    },
  ) {
    let p: Record<string, any> = merge({}, params, {
      filter: {
        status: "Active",
        $or: [],
      },
    });

    // if (!options?.showOutOfStock && !params?.filter?.availableQuantity) {
    //   p.filter.$or.push({ availableQuantity: { $gt: 0 } });
    // }

    if (p?.filter?.$or?.length === 0) {
      delete p.filter.$or;
    }

    // Prepare request params: include distance only when it's meaningful.
    // Default to not excluding by delivery radius unless a caller opts in.
    const reqParams: Record<string, any> = {
      excludeByDeliveryRadius: false,
      ...p,
    };

    // If caller passed distance === 'all', the API should not receive a distance
    // filter; instead instruct backend to exclude delivery-radius filtering.
    if (distance === "all") {
      reqParams.excludeByDeliveryRadius = false;
      reqParams.distance = 1000000000;
    } else if (typeof distance !== "undefined" && distance !== null) {
      reqParams.distance = distance;
    }

    const resp = await AjaxService.request(
      `${API}catalog/seller-deals/network`,
      "GET",
      reqParams,
    );

    return resp;
  }

  static getNetworkMenus(
    params: Record<string, any>,
    distance: number | string = DEFAULT_BROWSE_DISTANCE,
  ) {
    const { distance: distanceFromParams, ...cleanParams } = params;
    const p = {
      ...cleanParams,
      groupbycond: "menu",
    };
    return this.getNetworkDeals(p, distanceFromParams || distance);
  }

  static getNetworkCategories(
    params: Record<string, any>,
    distance: number | string = DEFAULT_BROWSE_DISTANCE,
  ) {
    const { distance: distanceFromParams, ...cleanParams } = params;
    const p = {
      ...cleanParams,
      groupbycond: "category",
    };
    return this.getNetworkDeals(p, distanceFromParams || distance);
  }

  static getNetworkParentCategories(
    params: Record<string, any>,
    distance: number | string = DEFAULT_BROWSE_DISTANCE,
  ) {
    const { distance: distanceFromParams, ...cleanParams } = params;
    const p = {
      ...cleanParams,
      groupbycond: "parentCategory",
    };
    return this.getNetworkDeals(p, distanceFromParams || distance);
  }

  static getNetworkBrands(
    params: Record<string, any>,
    distance: number | string = DEFAULT_BROWSE_DISTANCE,
  ) {
    const { distance: distanceFromParams, ...cleanParams } = params;
    const p = {
      ...cleanParams,
      groupbycond: "brand",
    };
    return this.getNetworkDeals(p, distanceFromParams || distance);
  }

  static getMultiCarts(params?: Record<string, any>) {
    return AjaxService.request(`${API}sales/cart/multi-carts`, "GET", params);
  }

  static bulkCheckout(cartPayloads: { cartId: string }[], user: any) {
    const address = {
      addressLine1: user.addressLine1 || "",
      addressLine2: user.addressLine2 || "",
      landmark: user.landmark || "",
      city: user.city || "",
      state: user.state || "",
      pincode: user.pincode || "",
    };

    const payload: any = {
      orderData: {
        shippingAddress: address,
        billingAddress: address,
        deliveryTimeSlot: user.deliveryTimeSlot || undefined,
        deliveryDistance:
          typeof user.deliveryDistance === "number"
            ? user.deliveryDistance
            : undefined,
        remarks: user.remarks || user.orderRemarks || "",
      },
      cartPayloads,
    };

    return AjaxService.request(
      `${API}sales/cart/bulk-checkout`,
      "POST",
      payload,
    );
  }

  static async packConfig(data: any | any[]) {
    return AjaxService.request(
      `${API}catalog/seller-deals/pack-config`,
      "PUT",
      data,
    );
  }

  static async getBulkStockSyncSummary() {
    const sellerRefId = AuthService.getLoggedInUserId(true);
    return AjaxService.request(
      `${API}catalog/seller-deals/bulk-stock-sync`,
      "GET",
      { mode: "summary", sellerRefId },
    );
  }

  static async runBulkStockSync() {
    const sellerRefId = AuthService.getLoggedInUserId(true);
    return AjaxService.request(
      `${API}catalog/seller-deals/bulk-stock-sync`,
      "GET",
      { mode: "run", sellerRefId },
    );
  }

  static getBaseParamsToBuyProduct() {
    return {
      parent: true,
      filter: {
        status: "Active",
      },
    };
  }
}

export default SellerCatalogService;
