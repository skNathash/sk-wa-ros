import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";

export type SlideFormData = {
  title: string;
  type: string;
  placeholderId: string;
  image: { id: string } | null;
  sliderPriority: number | null;
  redirectionType: string;
  validityFrom: Date | Date[] | undefined | null;
  validityTo: Date | Date[] | undefined | null;
  status: string;
  brands: any[];
  categories: any[];
  products: any[];
  menus: any[];
  keywords: string;
};

export const defaultFormData: SlideFormData = {
  title: "",
  type: "",
  placeholderId: "",
  image: null,
  sliderPriority: null,
  redirectionType: "",
  validityFrom: undefined,
  validityTo: undefined,
  status: "Active",
  brands: [],
  categories: [],
  products: [],
  menus: [],
  keywords: "",
};

export const validateSlideForm = (data: SlideFormData) => {
  if (!data.title?.trim()) {
    return { msg: "Title is required", status: false };
  }

  if (!data.type) {
    return { msg: "Type is required", status: false };
  }

  if (!data.placeholderId) {
    return { msg: "Placeholder is required", status: false };
  }

  if (!data.image) {
    return { msg: "Image is required", status: false };
  }

  if (!data.sliderPriority) {
    return { msg: "Slider priority is required", status: false };
  }

  if (!data.redirectionType) {
    return { msg: "Redirection type is required", status: false };
  }

  if (data.redirectionType === "brand" && !data.brands?.length) {
    return { msg: "Please select at least one brand", status: false };
  }

  if (data.redirectionType === "category" && !data.categories?.length) {
    return { msg: "Please select at least one category", status: false };
  }

  if (data.redirectionType === "product" && !data.products?.length) {
    return { msg: "Please select at least one product", status: false };
  }

  if (data.redirectionType === "brand_category") {
    if (!data.brands?.length) {
      return { msg: "Please select at least one brand", status: false };
    }
    if (!data.categories?.length) {
      return { msg: "Please select at least one category", status: false };
    }
  }

  if (data.redirectionType === "keywords" && !data.keywords?.trim()) {
    return { msg: "Keywords are required", status: false };
  }

  if (data.redirectionType === "menu" && !data.menus?.length) {
    return { msg: "Please select at least one menu", status: false };
  }

  if (
    !data.validityFrom ||
    (Array.isArray(data.validityFrom) && data.validityFrom.length === 0)
  ) {
    return { msg: "Validity from date is required", status: false };
  }

  if (
    !data.validityTo ||
    (Array.isArray(data.validityTo) && data.validityTo.length === 0)
  ) {
    return { msg: "Validity to date is required", status: false };
  }

  if (!data.status) {
    return { msg: "Status is required", status: false };
  }

  return { msg: "", status: true };
};

const redirectionTypeToBannerType: Record<string, string> = {
  no_action: "NoAction",
  brand: "Brand",
  category: "Category",
  product: "Product",
  brand_category: "BrandCategory",
  keywords: "Keywords",
  menu: "Menu",
};

const buildBannerForCondition = (data: SlideFormData) => {
  const condition: Record<string, any> = {};

  if (data.brands?.length) {
    condition.brands = data.brands.map((b: any) => ({
      id: b.value?.id || b.value?._id || "",
      brandId: b.value?.brandId || "",
      name: b.label || b.value?.name || "",
    }));
  }

  if (data.categories?.length) {
    condition.categories = data.categories.map((c: any) => ({
      id: c.value?.id || c.value?._id || "",
      name: c.label || c.value?.name || "",
    }));
  }

  if (data.products?.length) {
    condition.deals = data.products.map((p: any) => ({
      id: p.value?.id || p.value?._id || "",
      name: p.label || p.value?.name || "",
    }));
  }

  if (data.menus?.length) {
    condition.menus = data.menus.map((m: any) => ({
      id: m.value?.id || m.value?._id || "",
      name: m.label || m.value?.name || "",
    }));
  }

  if (data.keywords?.trim()) {
    condition.keyword = data.keywords.trim();
  }

  return Object.keys(condition).length ? condition : undefined;
};

export const prepareSlidePayload = (data: SlideFormData) => {
  const payload: Record<string, any> = {};

  payload.franchiseId = AuthService.getLoggedInUserId(false);
  payload.placeholderId = data.placeholderId;
  payload.title = data.title.trim();
  payload.type =
    data.type.toUpperCase() === "BOTH" ? "BOTH" : data.type.toUpperCase();
  payload.priority = Number(data.sliderPriority) || 1;
  payload.bannerType =
    redirectionTypeToBannerType[data.redirectionType] || "NoAction";

  const bannerForCondition = buildBannerForCondition(data);
  if (bannerForCondition) {
    payload.bannerForCondition = bannerForCondition;
  }

  payload.bannerImage = {
    assetId: data.image?.id || "",
    isActive: data.status === "Active",
  };

  if (data.validityFrom) {
    const dt = Array.isArray(data.validityFrom)
      ? data.validityFrom[0]
      : data.validityFrom;
    if (dt) payload.validFrom = startOfDay(new Date(dt)).toISOString();
  }

  if (data.validityTo) {
    const dt = Array.isArray(data.validityTo)
      ? data.validityTo[0]
      : data.validityTo;
    if (dt) payload.validTo = endOfDay(new Date(dt)).toISOString();
  }

  return payload;
};
