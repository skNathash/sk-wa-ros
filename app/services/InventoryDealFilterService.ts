import SellerCatalogService from "~/services/SellerCatalogService";

class InventoryDealFilterService {
  static prepareInventoryParamToFormData(params: Record<string, any>) {
    let formData: Record<string, any> = {};

    const categoryId = params.categoryId;
    const categoryName = params.categoryName;
    const brandId = params.brandId;
    const brandName = params.brandName;
    const menuId = params.menuId;
    const menuName = params.menuName;
    const companyId = params.companyId;
    const companyName = params.companyName;

    if (categoryId && categoryName) {
      formData.category = [{ label: categoryName, value: { id: categoryId } }];
    } else {
      formData.category = [];
    }

    if (brandId && brandName) {
      formData.brand = [{ label: brandName, value: { id: brandId } }];
    } else {
      formData.brand = [];
    }

    if (menuId && menuName) {
      formData.menu = [{ label: menuName, value: { id: menuId } }];
    } else {
      formData.menu = [];
    }

    if (companyId || companyName) {
      formData.companyName = [
        {
          label: companyName || "",
          value: { id: companyId || companyName, name: companyName },
        },
      ];
    } else {
      formData.companyName = [];
    }

    formData.status = params.status || "All";
    formData.velocity = params.velocity || "All";
    formData.stockStatus = params.stockStatus || "All";
    formData.alpha = params.alpha || "";
    formData.sellIn = params.sellIn || "All";
    formData.globalSort = params.globalSort || "recently-subscribed";
    formData.withoutStock = params.withoutStock === "true";
    formData.onlyOffers = params.onlyOffers === "true";
    formData.isGroupDeal = params.isGroupDeal === "true";
    formData.isPriceSlab = params.isPriceSlab === "true";
    formData.isPromotionalDeal = params.isPromotionalDeal === "true";
    formData.dealScope = params.dealScope || "All";

    // If `keys` is provided in the URL (comma-separated), populate the form `keys` array
    const keysParam = params.keys;
    if (keysParam) {
      formData.keys = keysParam.split(",").filter(Boolean);
    }

    return formData;
  }

  static prepareInventoryFilterQueryParams(filter: Record<string, any>) {
    const params = new URLSearchParams();

    if (filter.status && filter.status !== "All") {
      params.set("status", filter.status);
    }

    if (filter.velocity && filter.velocity !== "All") {
      params.set("velocity", filter.velocity);
    }

    if (filter.stockStatus && filter.stockStatus !== "All") {
      params.set("stockStatus", filter.stockStatus);
    }

    if (filter.alpha) {
      params.set("alpha", filter.alpha);
    }

    if (filter.sellIn && filter.sellIn !== "All") {
      params.set("sellIn", filter.sellIn);
    }

    if (filter.globalSort && filter.globalSort !== "recently-subscribed") {
      params.set("globalSort", filter.globalSort);
    }

    if (filter.withoutStock) {
      params.set("withoutStock", "true");
    }

    if (filter.onlyOffers) {
      params.set("onlyOffers", "true");
    }

    if (filter.isPriceSlab) {
      params.set("isPriceSlab", "true");
    }

    if (filter.isPromotionalDeal) {
      params.set("isPromotionalDeal", "true");
    }

    if (filter.category && filter.category.length > 0) {
      params.set("categoryId", filter.category[0].value.id);
      params.set("categoryName", filter.category[0].label);
    }

    if (filter.brand && filter.brand.length > 0) {
      params.set("brandId", filter.brand[0].value.id);
      params.set("brandName", filter.brand[0].label);
    }

    if (filter.menu && filter.menu.length > 0) {
      params.set("menuId", filter.menu[0].value.id);
      params.set("menuName", filter.menu[0].label);
    }

    if (filter.companyName && filter.companyName.length > 0) {
      params.set("companyId", filter.companyName[0].value.id);
      params.set("companyName", filter.companyName[0].label);
    }

    if (filter.keys && Array.isArray(filter.keys) && filter.keys.length) {
      params.set("keys", filter.keys.join(","));
    }

    if (typeof filter.isGroupDeal === "boolean" && filter.isGroupDeal) {
      params.set("isGroupDeal", "true");
    }

    if (filter.dealScope && filter.dealScope !== "All") {
      params.set("dealScope", filter.dealScope);
    }

    return params;
  }

  static prepareDealInventoryFilterParams(filter: Record<string, any>) {
    const params: Record<string, any> = {
      filter: {},
    };

    if (filter.status && filter.status !== "All") {
      params.filter.status = filter.status;
    }

    if (filter.status && filter.status !== "All") {
      params.filter.status = filter.status;
    }

    // Handle category (array of objects with {label, value: {}})
    if (Array.isArray(filter?.category) && filter.category.length > 0) {
      const categoryIds = filter.category
        .map((c: any) => c?.value?.id)
        .filter(Boolean);
      if (categoryIds.length > 0) {
        params.filter["applicableCategory.categoryId"] = {
          $in: categoryIds,
        };
      }
    }

    // Handle brand (array of objects with {label, value: {}})
    if (Array.isArray(filter?.brand) && filter.brand.length > 0) {
      const brandIds = filter.brand
        .map((b: any) => b?.value?.id)
        .filter(Boolean);
      if (brandIds.length > 0) {
        params.filter["applicableBrand.brandId"] = {
          $in: brandIds,
        };
      }
    }

    // Handle menu (array of objects with {label, value: {}})
    if (Array.isArray(filter?.menu) && filter.menu.length > 0) {
      const menuIds = filter.menu.map((m: any) => m?.value?.id).filter(Boolean);
      if (menuIds.length > 0) {
        params.filter["applicableMenu.menuId"] = {
          $in: menuIds,
        };
      }
    }

    if (Array.isArray(filter?.companyName) && filter.companyName.length > 0) {
      const company = filter.companyName[0];
      if (company?.label) {
        params.filter.companyName = company.label;
      }
    }

    if (filter.velocity && filter.velocity !== "All") {
      if (filter.velocity === "consumerOffer") {
        params.filter.isConsumerOffer = true;
      } else if (filter.velocity === "outOfStock") {
        params.filter.quantity = { $lte: 0 };
      } else if (filter.velocity === "subscribedByCustomer") {
        params.filter["subscribedBy.type"] = "Customer";
      } else {
        params.filter.movementTypeFilter = filter.velocity;
      }
    }

    if (filter.stockStatus && filter.stockStatus !== "All") {
      if (filter.stockStatus === "Out of Stock") {
        params.filter.quantity = { $lte: 0 };
      } else {
        // For other stock statuses, assume they are handled by a stockStatus filter
        params.filter.stockStatusFilter = filter.stockStatus;
      }
    }

    // Handle selling configuration (pack type) filter
    if (filter.sellIn && filter.sellIn !== "All") {
      const sellingType = SellerCatalogService.getSellingTypes().find(
        (st) =>
          st.value === filter.sellIn ||
          st.apiValue === filter.sellIn ||
          st.label === filter.sellIn ||
          st.packType === filter.sellIn,
      );
      if (sellingType) {
        params.filter.$and = [
          {
            "packConfig.isDefault": true,
            "packConfig.packType": sellingType.apiValue,
          },
        ];
      }
    }

    // Toggle stock availability
    if (typeof filter.withoutStock === "boolean" && filter.withoutStock) {
      // Only show products without stock (quantity <= 0)
      params.filter.quantity = { $lte: 0 };
    }
    // When withoutStock is false, don't add any quantity filter to show all products

    if (filter.globalSort && filter.globalSort !== "all") {
      if (
        filter.globalSort === "price-desc" ||
        filter.globalSort === "price-asc"
      ) {
        const field = "networkSellingPrice.price";
        params.sort = { [field]: filter.globalSort === "price-desc" ? -1 : 1 };
      } else {
        params.sort = filter.globalSort;
      }
    }

    // If voice/keyword tokens were collected, serialize them to a comma-separated `keys` param
    if (filter.keys && Array.isArray(filter.keys) && filter.keys.length) {
      params.keys = filter.keys.join(",");
    }

    if (typeof filter.onlyOffers === "boolean" && filter.onlyOffers) {
      params.filter.isConsumerOffer = true;
    }

    // Only Group Deal filter
    if (typeof filter.isGroupDeal === "boolean" && filter.isGroupDeal) {
      params.filter.isGroupDeal = true;
    }

    if (typeof filter.isPriceSlab === "boolean" && filter.isPriceSlab) {
      params.filter.$or = [
        { networkPriceSlab: { $exists: true } },
        { customerPriceSlab: { $exists: true } },
      ];
    }

    if (
      typeof filter.isPromotionalDeal === "boolean" &&
      filter.isPromotionalDeal
    ) {
      params.filter.isPromotionalDeal = true;
    }

    if (filter.dealScope === "Local") {
      params.filter.isLocalDeal = true;
    } else if (filter.dealScope === "Global") {
      params.filter.isLocalDeal = false;
    }

    return params;
  }
}

export default InventoryDealFilterService;
