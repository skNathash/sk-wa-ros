import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";
import StorageService from "./StorageService";
import MiscService from "./MiscService";
import CommonService from "./CommonService";
import UomPriceService from "./UomPriceService";
import type { AxiosRequestConfig } from "axios";

class InventorySubscribeService {
  static getUomOptions() {
    return [
      { label: "pcs", value: "piece" },
      // { label: "kg", value: "kg" },
      { label: "gm", value: "gm" },
      // { label: "ltr", value: "ltr" },
      { label: "ml", value: "ml" },
    ];
  }

  static getSortOptions() {
    return [
      {
        label: "Popularity",
        value: "popular",
      },
      {
        label: "Newly Launched",
        value: "newly-created",
      },
      { label: "A-Z", value: "a-z" },
      { label: "Z-A", value: "z-a" },
    ];
  }

  static getSortParams(type: string, sortType: string) {
    let key = "";

    if (type === "menu") {
      key = "_id.menuName";
    } else if (type === "category") {
      key = "_id.categoryName";
    } else if (type === "brand") {
      key = "_id.brandName";
    } else if (type === "product") {
      key = "name";
    }

    if (sortType === "a-z") {
      return { sort: { [key]: 1 } };
    } else if (sortType === "z-a") {
      return { sort: { [key]: -1 } };
    } else if (sortType === "mrp-low-to-high") {
      return { sort: { mrp: 1 } };
    } else if (sortType === "mrp-high-to-low") {
      return { sort: { mrp: -1 } };
    } else if (sortType === "popular") {
      return { sort: { sortType: "popular" } };
    } else if (sortType === "newly-created") {
      return { sort: { sortType: "newly-created" } };
    }
  }

  static getStatuses() {
    return [
      {
        label: "Approval Pending",
        value: "approval_pending",
        statuses: ["Submitted", "Created", "DoItLater", "NotFound"],
        color: "warning",
      },
      {
        label: "Approved",
        value: "approved",
        statuses: ["Imported", "Duplicate", "Synced"],
        color: "success",
      },
      {
        label: "Rejected",
        value: "rejected",
        statuses: ["Rejected"],
        color: "danger",
      },
    ];
  }

  static triggerItemAddedEvent(detail: any = null) {
    MiscService.createEvent("subscribe-item-added", detail);
  }

  static triggerItemRemovedEvent(detail: any = null) {
    MiscService.createEvent("subscribe-item-removed", detail);
  }

  static triggerOpenCartPopoverEvent() {
    MiscService.createEvent("subscribe-open-cart-popover", null);
  }

  static triggerSubscribeSuccessEvent(detail: any = null) {
    MiscService.createEvent("subscribe-success", detail);
  }

  static getDeals(params: any, config?: AxiosRequestConfig) {
    const p = { ...params, ignoreAsset: true };
    return AjaxService.request(
      `${API}/catalog/deals/popular`,
      "GET",
      p,
      config,
    );
  }

  static async getDealsCount(params: any, config?: AxiosRequestConfig) {
    const p = { ...params, outputType: "count", ignoreAsset: true };
    return this.getDeals(p, config);
  }

  static formatDealResponse(
    data: any,
    options?: { groupDealOnlySubscribed?: boolean },
  ) {
    return data.map((deal: any) => {
      const localCartItem = this.getLocalCartItem(deal._id);
      const groupDealData = deal.groupDeal
        ? CommonService.formatGroupDealData(
            deal.dealId,
            {
              name: deal.groupDeal?.csa,
              groupedDeals: deal.groupDeal?.groupDealInfo,
            },
            !options?.groupDealOnlySubscribed,
          )
        : [];

      return {
        images: deal.images || [],
        mrp: deal.mrp,
        name: deal.name,
        netWeight: deal.csaAttr?.find((attr: any) => attr.name === "Weight")
          ?.value,
        price: deal.b2bPrice || deal.mrp,
        quantity: deal.quantity,
        unit: deal.unit,
        dealId: deal.dealId,
        dealRefId: deal.dealRefId || deal.dealId,
        brand: {
          name: deal.applicableBrand?.brandName,
          id: deal.applicableBrand?.brandId,
        },
        category: {
          name: deal.applicableCategory?.categoryName,
          id: deal.applicableCategory?.categoryId,
        },
        menu: {
          name: deal.applicableMenu?.menuName,
          id: deal.applicableMenu?.menuId,
        },
        description: deal.description,
        _id: deal._id,
        isSubscribed: deal.isSubscribed,
        barcodes: deal.barcodes || [],
        barcodeStr: deal.barcodes?.join(", ") || "",
        itemId: localCartItem?.itemId || "",
        isInCart: !!localCartItem?.dealId,
        cartQuantity: localCartItem?.quantity || 0,
        hsn: deal.hsn || "",
        gst: deal.tax || 0,
        consumerOffer: {
          enabled: deal.isConsumerOffer ? true : false,
          title: deal.consumerOfferData || "",
        },
        groupDeals: groupDealData,
        companyName: deal.companyName || "",
        totalSubscribed: deal.totalSubscribed || 0,
        shelfLife: deal.shelfLife || "",
      };
    });
  }

  static formatCategoryResponse(data: any) {
    const selectedLang = MiscService.getSelectedLang();
    return data.map((category: any) => ({
      name: category._id?.categoryName,
      _id: category._id?.categoryId,
      totalDeals: category.totalDeals,
      totalBrands: category.totalBrands,
      uniqueBrandCount: category.uniqueBrandCount,
      _displayImg: category?._id?.images?.[0]?.image,
      id: category.categoryObjectId,
      _displayName: category?.lng?.[selectedLang] || category._id?.categoryName,
    }));
  }

  static formatParentCategoryResponse(data: Array<any>) {
    const selectedLang = MiscService.getSelectedLang();
    return data.map((category: any) => ({
      name: category._id?.parentCategoryName,
      _id: category._id?.parentCategoryId,
      totalDeals: category.totalDeals,
      totalBrands: category.totalBrands,
      uniqueBrandCount: category.uniqueBrandCount,
      _displayImg: category?._id?.images?.[0]?.image,
      id: category.parentCategoryObjectId,
      _displayName:
        category?.lng?.[selectedLang] || category._id?.parentCategoryName,
    }));
  }

  static formatMenuResponse(data: any) {
    const selectedLang = MiscService.getSelectedLang();
    return data.map((menu: any) => ({
      name: menu._id?.menuName,
      _id: menu._id?.menuId,
      totalDeals: menu.totalDeals,
      totalBrands: menu.totalBrands,
      uniqueBrandCount: menu.uniqueBrandCount,
      _displayImg: menu?._id?.images?.[0]?.image,
      id: menu.menuObjectId,
      _displayName: menu?.lng?.[selectedLang] || menu._id?.menuName,
    }));
  }

  static formatCompanyResponse(data: any) {
    return data.map((company: any) => ({
      name: company._id?.companyName,
      _id: company._id?.companyName || "",
      totalDeals: company.totalDeals,
      _displayImg: company?._id?.images?.[0]?.image,
      id: company._id?.companyName || "",
      _displayName: company?._id?.companyName,
    }));
  }

  static formatBrandResponse(data: any) {
    const selectedLang = MiscService.getSelectedLang();
    return data.map((brand: any) => ({
      name: brand._id?.brandName,
      _id: brand._id?.brandId,
      totalDeals: brand.totalDeals,
      uniqueCategoryCount: brand.uniqueCategoryCount,
      _displayImg: brand?._id?.images?.[0]?.image || brand?._id?.images?.[0],
      id: brand.brandObjectId,
      _displayName: brand?.lng?.[selectedLang] || brand._id?.brandName,
    }));
  }

  static formatCartProductsResponse(products: any) {
    if (!products) {
      return [];
    }

    return products.map((product: any) => {
      return {
        images: product.images || [],
        mrp: product.mrp,
        name: product.name,
        price: product.price || 0,
        quantity: product.quantity,
        unit: product.unit,
        brand: { name: product.brand?.name || "", id: product.brand?.id || "" },
        category: {
          name: product.category?.name || "",
          id: product.category?.id || "",
        },
        menu: { name: product.menu?.name || "", id: product.menu?.id || "" },
        description: product.description,
        _id: product.dealId,
        isSubscribed: product.isSubscribed,
        barcodes: product.barcodes || [],
        barcodeStr: product.barcodes?.join(", ") || "",
        itemId: product.itemId,
        totalPrice: product.totalPrice,
        addedAt: product.addedAt,
        isCloned: product.isCloned,
      };
    });
  }

  static getMenus(params: any, config?: AxiosRequestConfig) {
    let p = { ...params, groupbycond: "menu" };
    return this.getDeals(p, config);
  }

  static getBrands(params: any, config?: AxiosRequestConfig) {
    let p = { ...params, groupbycond: "brand" };
    return this.getDeals(p, config);
  }

  static getCategories(params: any, config?: AxiosRequestConfig) {
    let p = { ...params, groupbycond: "category" };
    return this.getDeals(p, config);
  }

  static getParentCategories(params: any) {
    let p = { ...params, groupbycond: "parentCategory" };
    return this.getDeals(p);
  }

  static getCompanies(params: any) {
    let p = { ...params, groupbycond: "companyName" };
    return this.getDeals(p);
  }

  static getMenusCount(params: any) {
    const p = { ...params, groupbycond: "menu" };
    return this.getDealsCount(p);
  }

  static getBrandsCount(params: any) {
    const p = { ...params, groupbycond: "brand" };
    return this.getDealsCount(p);
  }

  static getCategoriesCount(params: any) {
    const p = { ...params, groupbycond: "category" };
    return this.getDealsCount(p);
  }

  static getParentCategoriesCount(params: any) {
    const p = { ...params, groupbycond: "parentCategory" };
    return this.getDealsCount(p);
  }

  static getCompaniesCount(params: any) {
    const p = { ...params, groupbycond: "companyName" };
    return this.getDealsCount(p);
  }

  static getCart(params: any = {}) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/cart`,
      "GET",
      params,
    );
  }

  static overrideLocalCart(data: any) {
    StorageService.set("subscart", data);
  }

  static saveInLocalCart(data: {
    dealId: string;
    dealName: string;
    quantity: number;
    price: number;
    images: string[];
    itemId: string;
    subCategoryId?: string;
  }) {
    let cart = StorageService.get("subscart");
    if (cart) {
      cart.push(data);
    } else {
      cart = [data];
    }
    StorageService.set("subscart", cart);
  }

  static saveBulkInLocalCart(
    products: Array<{
      dealId: string;
      dealName: string;
      quantity: number;
      price: number;
      images: string[];
      itemId: string;
      subCategoryId?: string;
    }>,
  ) {
    let cart = StorageService.get("subscart");
    if (cart) {
      cart.push(...products);
    } else {
      cart = [...products];
    }
    StorageService.set("subscart", cart);
  }

  static getLocalCart() {
    return StorageService.get("subscart") || [];
  }

  static getLocalCartItem(dealId: string) {
    const cart = this.getLocalCart();
    return cart.find((item: any) => item.dealId === dealId);
  }

  static removeLocalCartItem(itemId: string) {
    const cart = this.getLocalCart();
    const newCart = cart.filter((item: any) => item.itemId !== itemId);
    StorageService.set("subscart", newCart);
  }

  static clearLocalCart() {
    StorageService.remove("subscart");
  }

  static createRequest(params: any) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/cart`,
      "POST",
      params,
    );
  }

  static removeRequestItem(itemId: string) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/cart/item/${itemId}`,
      "DELETE",
      {},
    );
  }

  static clearCart() {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/cart`,
      "DELETE",
      {},
    );
  }

  static updateCartItem(
    cartId: string,
    itemId: string,
    params: Record<string, any>,
  ) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/cart/${cartId}/item/${itemId}`,
      "PUT",
      params,
    );
  }

  static saveToInventory(params: any) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/process-cart-inventory`,
      "POST",
      params,
    );
  }

  static getCartSummary(cartId: string) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/cart/${cartId}`,
      "GET",
      { isCartsummaryOnly: true },
    );
  }

  static uploadProducts(params: any) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/po-seller-import-products`,
      "POST",
      params,
    );
  }

  static importStoreProduct(params: any) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/add/seller-import-product`,
      "POST",
      params,
    );
  }

  /**
   * Create several store products in one call. Each entry in `products` carries
   * the same payload shape as `importStoreProduct`, so the catalog team gets one
   * request per product to verify instead of a flurry of single creates.
   */
  static bulkImportStoreProducts(products: any[]) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/add/bulk-seller-import-products`,
      "POST",
      { products },
    );
  }

  /**
   * Build the seller-import create-request payload from a StoreKing AI-extracted
   * deal (`aiSuggestedDeals[0]`) plus the seller-confirmed price/unit. This is
   * the single source of truth for the AI create-request shape — it mirrors the
   * payload the Add Product page assembles for AI-sourced products: brand,
   * category, model and weight are intentionally left empty so the extracted
   * values don't create incorrect mappings.
   *
   * - `mrp`/`uom` are the values the seller confirmed in the review modal. For
   *   small uoms (gm/ml) the entered price is converted to the API's lower uom.
   * - The AI response images are merged onto any already-uploaded images
   *   (deduped by id/url); the absolute AI urls are stored as-is and converted
   *   to assets by the backend on submit.
   * - `barcode` falls back to the first AI-extracted barcode when none is given.
   */
  static buildAiImportPayload(
    product: any,
    opts: {
      mrp: number;
      uom: string;
      barcode?: string;
      images?: { id: string }[];
      scanItemId?: string;
      invalidBarcodeId?: string;
    },
  ) {
    const aiImageUrls: string[] = Array.isArray(product?.images)
      ? product.images.filter(Boolean)
      : [];
    const current = opts.images || [];
    const existingIds = new Set(current.map((i) => i.id));
    const mergedImages = [
      ...current,
      ...aiImageUrls
        .filter((url) => !existingIds.has(url))
        .map((url) => ({ id: url })),
    ];

    // GST rate comes from the AI extraction as `tax`; forward it as a bare
    // number with no "%" symbol. HSN is forwarded as-is when present.
    const gst = product?.tax;
    const hsnNumber = product?.hsnNumber;

    const payload: Record<string, any> = {
      productName: (product?.name || "").trim(),
      qty: 0,
      mrp: Number(UomPriceService.toApiPrice(opts.mrp, opts.uom)),
      barcode: opts.barcode || product?.barcodes?.[0] || "",
      uom: opts.uom,
      description: product?.description || "",
      // Brand/category are left empty for AI-created products.
      category: { id: "", categoryId: "", name: "" },
      images: mergedImages.map((e) => e.id),
      ...(gst !== undefined && gst !== null && gst !== ""
        ? { gst: Number(String(gst).replace(/%/g, "").trim()) }
        : {}),
      ...(hsnNumber ? { hsnNumber } : {}),
      ...(product?.aiCacheId ? { aiCacheId: product.aiCacheId } : {}),
      ...(opts.invalidBarcodeId ? { invalidBarcodeId: opts.invalidBarcodeId } : {}),
      ...(opts.scanItemId ? { scanItemId: opts.scanItemId } : {}),
    };

    return payload;
  }

  /**
   * Submit a seller-import create request through the appropriate endpoint.
   * Bulk requests go through the bulk endpoint (one product per call) so they
   * land in the same catalog-team queue as the rest of a scanned batch.
   * Returns the raw response alongside a normalized `succeeded` flag (bulk
   * accepts any 2xx; single expects exactly 200).
   */
  static async createSellerImportRequest(
    payload: any,
    apiType: "single" | "bulk" = "single",
  ) {
    const response =
      apiType === "bulk"
        ? await this.bulkImportStoreProducts([payload])
        : await this.importStoreProduct(payload);
    const succeeded =
      apiType === "bulk"
        ? response?.statusCode >= 200 && response?.statusCode < 300
        : response?.statusCode === 200;
    return { response, succeeded };
  }

  static fetchImportedStoreProducts(params: any) {
    return AjaxService.request(
      `${API}oms/${API_VERSION}/seller/import/store/products`,
      "GET",
      params,
    );
  }

  static getSellerImportProducts(params: any) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/seller-import-products`,
      "GET",
      params,
    );
  }

  static formatSellerImportProducts(data: any) {
    const statuses = this.getStatuses();

    return data.map((item: any) => {
      const type = item.productType;
      const status = item.status;

      // Find the status configuration for label and color
      const statusConfig = statuses.find((s) =>
        s.statuses.includes(item.status),
      );

      const isLinkedExisting =
        type == "Existing" && (status === "Synced" || status === "Imported");
      const isLinkedNew =
        type == "New" && (status === "Synced" || status === "Imported");

      let summaryStatus = statusConfig ? statusConfig.label : item.status;

      if (isLinkedExisting) {
        summaryStatus = "Approved and Linked";
      } else if (isLinkedNew) {
        summaryStatus = "Approved as New Product";
      }

      let summaryDescription = "";
      if (isLinkedExisting) {
        summaryDescription =
          "The submission was linked to an existing product in the catalog.";
      } else if (isLinkedNew) {
        summaryDescription =
          "A new product was created in the catalog based on your submission.";
      } else if (status === "Rejected") {
        summaryDescription = "The submission was rejected";
      }

      return {
        ...item,
        isLinkedExisting,
        isLinkedNew,
        summaryStatus,
        summaryDescription,
        statusLabel: statusConfig ? statusConfig.label : item.status,
        statusColor: statusConfig ? statusConfig.color : "default",
      };
    });
  }

  static bulkSubscription(
    products: Array<{
      dealId: string;
      name: string;
      quantity: number;
      mrp: number;
      price: number;
      images?: string[];
      barcodes: string[];
    }>,
  ) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/bulk-cart`,
      "POST",
      { products },
    );
  }

  static async subscribePendingProducts(data: Record<string, any>) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/catalog-subscribe-by-request-id`,
      "POST",
      data,
    );
  }

  static async subscribeDeal(params: any) {
    return AjaxService.request(`${API}catalog/seller-deals`, "POST", params);
  }

  static async getParentSubscribeSummary(params: any = {}) {
    return AjaxService.request(
      `${API}catalog/seller-deals/subscribe/parent/summary`,
      "GET",
      params,
    );
  }

  static async subscribeParentDeals(params: any) {
    return AjaxService.request(
      `${API}catalog/seller-deals/subscribe/parent/deals`,
      "POST",
      params,
    );
  }

  static async createSellerDealRequests(params: any) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/deal-update-requests`,
      "POST",
      params,
    );
  }

  static async getSellerDealRequests(params: any) {
    return AjaxService.request(
      `${API}purchase/catalog-subscriptions/deal-update-requests`,
      "GET",
      params,
    );
  }

  static aiSearchByBarcodes(
    params: { searchKeyword?: string; images?: string[] },
    options?: { searchInSk?: boolean; searchInAi?: boolean },
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${API}/catalog/product-extractor/ai-search`,
      "POST",
      {
        ...(params.searchKeyword !== undefined
          ? { searchKeyword: params.searchKeyword }
          : {}),
        ...(params.images ? { imageUrls: params.images } : {}),
        ...options,
      },
      config,
    );
  }

  /**
   * Create a bulk barcode scan batch. Returns a batchId that subsequent
   * single-barcode scans are appended to via `appendToBulkBarcodeScan`.
   */
  static aiBulkBarcodeScan(
    barcodes: { searchKeyword: string; qty: number }[],
    options?: { searchInSk?: boolean; searchInAi?: boolean; skLimit?: number },
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${API}/catalog/ai-bulkbarcode-scan`,
      "POST",
      {
        barcodes,
        searchOptions: {
          searchInSk: true,
          searchInAi: true,
          skLimit: 50,
          ...options,
        },
      },
      config,
    );
  }

  /**
   * Fetch details for an existing bulk barcode scan batch.
   */
  static getAiBulkBarcodeScanBatch(
    batchId: string,
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${API}/catalog/ai-bulkbarcode-scan/${batchId}`,
      "GET",
      { includeItems: true },
      config,
    );
  }

  /**
   * Remove a single scanned item from a bulk barcode scan batch by barcode.
   */
  static deleteAiBulkBarcodeScanItem(
    batchId: string,
    barcode: string,
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${API}/catalog/ai-bulkbarcode-scan/${batchId}/item?barcode=${encodeURIComponent(
        barcode,
      )}`,
      "DELETE",
      undefined,
      config,
    );
  }

  /**
   * Remove a single processed bulk barcode scan item by its item id.
   */
  static deleteAiBulkBarcodeScanItemById(
    itemId: string,
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${API}/catalog/ai-bulkbarcode-scan/items/${itemId}`,
      "DELETE",
      undefined,
      config,
    );
  }

  /**
   * Append one or more barcodes to an existing bulk barcode scan batch. Pass a
   * single barcode or an array — both go up as `{ batchId, barcodes: [...] }`.
   */
  static appendToBulkBarcodeScan(
    batchId: string,
    barcode:
      | { searchKeyword: string; text?: string; qty: number }
      | { searchKeyword: string; text?: string; qty: number }[],
    config?: AxiosRequestConfig,
  ) {
    const barcodes = Array.isArray(barcode) ? barcode : [barcode];
    return AjaxService.request(
      `${API}/catalog/ai-bulkbarcode-scan`,
      "POST",
      { batchId, barcodes },
      config,
    );
  }

  /**
   * Mark a bulk barcode scan batch as completed — called once its items have
   * been subscribed and/or sent for bulk product creation.
   */
  static submitAiBulkBarcodeScanBatch(
    batchId: string,
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${API}/catalog/ai-bulkbarcode-scan/${batchId}/submit`,
      "POST",
      undefined,
      config,
    );
  }

  /**
   * Fetch all processed items from bulk barcode scan batches.
   */
  static getAiBulkBarcodeScanItems(params: any, config?: AxiosRequestConfig) {
    return AjaxService.request(
      `${API}/catalog/ai-bulkbarcode-scan/items`,
      "GET",
      params,
      config,
    );
  }

  static async getInvalidBarcodes(params: any) {
    return AjaxService.request(`${API}catalog/invalid-barcodes`, "GET", params);
  }

  static async searchBarcode(
    barcode: string,
    isLocalDeal?: boolean,
    dealId?: string,
  ) {
    const response: any = await AjaxService.request(
      `${API}catalog/barcodes/search`,
      "GET",
      {
        barcode,
        ...(isLocalDeal ? { isLocalDeal } : {}),
        ...(dealId ? { dealId } : {}),
      },
    );

    let errMsg = "";
    if (response?.data?.isNewbarcode === false) {
      const dealNames = [
        ...(response?.data?.data?.dealResults || []),
        ...(response?.data?.data?.sellerDealResults || []),
      ]
        .map((d: any) => d?.dealName)
        .filter(Boolean);

      if (dealNames.length) {
        errMsg = `Barcode ${barcode} is already linked to: ${dealNames.join(", ")}`;
      }
    }

    return { ...response, errMsg };
  }

  // Remove an invalid barcode by its id
  static async removeInvalidBarcode(id: string) {
    return AjaxService.request(
      `${API}catalog/invalid-barcodes/${id}/status`,
      "PUT",
      {
        status: "REJECTED",
      },
    );
  }

  static async getCartAndPendingCount(config?: AxiosRequestConfig) {
    let cartCount = 0;
    let pendingCount = 0;

    try {
      const response = await this.getCart();
      if (response.statusCode === 200) {
        cartCount = response.data?.data?.products?.length || 0;
      } else {
        cartCount = this.getLocalCart()?.length || 0;
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
      cartCount = this.getLocalCart()?.length || 0;
    }

    try {
      const res: any = await this.getAiBulkBarcodeScanItems(
        {
          filter: {
            status: {
              $in: ["Completed", "Processing"],
            },
            matchStatus: {
              $in: ["FoundInAi", "NotFound"],
            },
          },
          outputType: "count",
        },
        config,
      );
      pendingCount = res?.data?.data?.count || res?.data?.count || 0;
    } catch (error) {
      console.error("Error fetching pending count:", error);
    }

    return {
      cartCount,
      pendingCount,
      totalCount: cartCount + pendingCount,
    };
  }
}

export default InventorySubscribeService;
