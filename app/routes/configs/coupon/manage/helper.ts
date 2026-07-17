import { endOfDay, startOfDay } from "date-fns";
import CouponService from "~/services/CouponService";

export interface ScopeItem {
  label: string;
  value: Record<string, any>;
}

export interface CouponFormFields {
  title: string;
  description: string;
  code: string;
  codeType: string;
  applicableFor: string[];
  validFrom: Date | undefined;
  validTill: Date | undefined;
  scopeType: string;
  scopeIds: ScopeItem[];
  discountKind: string;
  discountValue: string;
  applyOn: string;
  maxDiscountPerUse: string;
  minCartValue: string;
  applyFrequency: string;
  maxUsesPerCustomer: string;
  maxGlobalUses: string;
  status: string;
}

export const defaultValues: CouponFormFields = {
  title: "",
  description: "",
  code: "",
  codeType: "MANUAL",
  applicableFor: [],
  validFrom: undefined,
  validTill: undefined,
  scopeType: "CART",
  scopeIds: [],
  discountKind: "PERCENT",
  discountValue: "",
  applyOn: "PRICE",
  maxDiscountPerUse: "",
  minCartValue: "",
  applyFrequency: "SINGLE",
  maxUsesPerCustomer: "1",
  maxGlobalUses: "1000",
  status: "",
};

// Code Type hidden for now, defaults to MANUAL
// export const codeTypeOptions = [
//   { label: "Manual", value: "MANUAL" },
//   { label: "Auto Generated", value: "AUTO" },
// ];

export const applicableForOptions = ["B2C", "B2B"];

export const scopeTypeOptions = [
  { label: "Cart", value: "CART" },
  { label: "Category", value: "CATEGORY" },
  { label: "Brand", value: "BRAND" },
  { label: "Menu", value: "MENU" },
];

export const discountKindOptions = [
  { label: "Percentage", value: "PERCENT" },
  { label: "Fixed", value: "FLAT" },
];

export const applyOnOptions = [
  { label: "Price", value: "PRICE" },
  { label: "MRP", value: "MRP" },
];

// Usage Policy hidden for now, defaults passed in payload
// export const applyFrequencyOptions = [
//   { label: "Single", value: "SINGLE" },
//   { label: "Multiple", value: "MULTIPLE" },
// ];

// Map the scope.type to the key holding the id list in the payload
export const scopeIdKey = (type: string) => {
  switch (type) {
    case "MENU":
      return "menuIds";
    case "BRAND":
      return "brandIds";
    case "CATEGORY":
    default:
      return "categoryIds";
  }
};

// Map the scope.type to the key holding a single id on a search-input item
const scopeItemIdKey = (type: string) => {
  switch (type) {
    case "MENU":
      return "menuId";
    case "BRAND":
      return "brandId";
    case "CATEGORY":
    default:
      return "categoryId";
  }
};

// Pull the relevant id out of a search-input item for the given scope type
export const itemIdByScope = (item: ScopeItem, type: string) => {
  const v = item?.value || {};
  return v[scopeItemIdKey(type)] || v.id;
};

// Build the { id, refId, name } entry sent to the backend for a scope item.
// `id` is the Mongo document _id (objId), `refId` is the catalog reference id
// (categoryId/brandId/menuId) and `name` is the human-readable label.
export const itemToScopeEntry = (item: ScopeItem, type: string) => {
  const v = item?.value || {};
  return {
    id: v.objId ?? v.id,
    refId: itemIdByScope(item, type),
    name: v.name ?? item.label,
  };
};

// Takes the API response for a single coupon and returns the form data used to
// auto-fill the form when editing. Accepts the raw service response and digs
// out the coupon object regardless of how it is nested.
export const mapResponseToForm = (response: any): CouponFormFields => {
  const c = response?.data?.data ?? {};

  const scopeT = c.scope?.type || "CATEGORY";
  const entries = c.scope?.[scopeIdKey(scopeT)] || c.scope?.categoryIds || [];
  const idKey = scopeItemIdKey(scopeT);
  // The backend returns { id, refId, name } entries. Rebuild the search-input
  // items from them so the picker shows the saved names. We also tolerate the
  // older id-only shape for backwards compatibility.
  const scopeIds: ScopeItem[] = Array.isArray(entries)
    ? entries.map((entry: any) => {
        if (entry && typeof entry === "object") {
          // refId is the catalog reference id used for matching/dedup; id is
          // the Mongo document _id we keep around as objId.
          const refId = entry.refId ?? entry.id;
          return {
            label: entry.name || refId,
            value: {
              id: refId,
              [idKey]: refId,
              name: entry.name,
              objId: entry.id,
            },
          };
        }
        return { label: entry, value: { id: entry, [idKey]: entry } };
      })
    : [];

  return {
    title: c.title || "",
    description: c.description || "",
    code: c.code || "",
    codeType: c.codeType || "MANUAL",
    applicableFor: c.applicableFor || [],
    validFrom: c.validFrom ? new Date(c.validFrom) : undefined,
    validTill: c.validTill ? new Date(c.validTill) : undefined,
    scopeType: scopeT,
    scopeIds,
    discountKind: c.discount?.kind || "PERCENT",
    discountValue: c.discount?.value?.toString() || "",
    applyOn: c.discount?.applyOn || "PRICE",
    maxDiscountPerUse: c.discount?.maxDiscountPerUse?.toString() || "",
    minCartValue: c.conditions?.minCartValue?.toString() || "",
    applyFrequency: c.usagePolicy?.applyFrequency || "SINGLE",
    maxUsesPerCustomer: c.usagePolicy?.maxUsesPerCustomer?.toString() || "",
    maxGlobalUses: c.usagePolicy?.maxGlobalUses?.toString() || "",
    status: c.status || "",
  };
};

// Fetch a single coupon by id and map it to the form fields used when editing.
// Returns null when the request fails or no coupon is found.
export const getCouponForm = async (
  id: string,
): Promise<CouponFormFields | null> => {
  const response = await CouponService.getCouponById(id);
  if (response?.statusCode === 200) {
    const c = response.data?.data;
    return c ? mapResponseToForm(response) : null;
  }
  return null;
};

// Create or update a coupon from the form data. Builds the payload and calls
// the matching API, returning the raw service response for the caller to handle.
// On update we also attach the user-entered remarks (audit note); create has no
// remarks.
export const saveCoupon = (
  isEdit: boolean,
  id: string,
  form: CouponFormFields,
  remarks?: string,
) => {
  const payload = preparePayload(form);
  if (isEdit) {
    const note = remarks?.trim();
    return CouponService.updateCoupon(
      id,
      note ? { ...payload, remarks: note } : payload,
    );
  }
  return CouponService.createCoupon(payload);
};

// Takes the form data and builds the payload sent to the create/update API.
export const preparePayload = (form: CouponFormFields) => {
  // For "CART" the coupon applies to the whole cart, so we send the scope type
  // alone with no id list. Other scope types also carry the selected id list.
  const scope: Record<string, any> = { type: form.scopeType };
  if (form.scopeType !== "CART") {
    const items = (form.scopeIds || [])
      .map((item) => itemToScopeEntry(item, form.scopeType))
      .filter((entry) => entry.id);
    scope[scopeIdKey(form.scopeType)] = items;
  }

  const discount: Record<string, any> = {
    kind: form.discountKind,
    value: Number(form.discountValue) || 0,
    applyOn: form.applyOn,
  };
  
  if (form.discountKind !== "PERCENT") {
    // Fixed coupons don't show a Max Discount Per Use input; the cap is always
    // the discount value itself.
    discount.maxDiscountPerUse = Number(form.discountValue) || 0;
  } else if (form.maxDiscountPerUse !== "") {
    discount.maxDiscountPerUse = Number(form.maxDiscountPerUse);
  }

  const conditions: Record<string, any> = {};
  if (form.minCartValue !== "") {
    conditions.minCartValue = Number(form.minCartValue);
  }

  const usagePolicy: Record<string, any> = {
    applyFrequency: form.applyFrequency,
  };

  if (form.maxUsesPerCustomer !== "") {
    usagePolicy.maxUsesPerCustomer = Number(form.maxUsesPerCustomer);
  }

  if (form.maxGlobalUses !== "") {
    usagePolicy.maxGlobalUses = Number(form.maxGlobalUses);
  }

  return {
    title: form.title,
    description: form.description,
    code: form.code,
    codeType: form.codeType,
    applicableFor: form.applicableFor,
    validFrom: form.validFrom ? startOfDay(form.validFrom).toISOString() : "",
    validTill: form.validTill ? endOfDay(form.validTill).toISOString() : "",
    scope,
    discount,
    conditions,
    usagePolicy,
  };
};

// Validates the form data and returns an error message, or an empty string when
// everything is valid. Covers the rules the react-hook-form field rules cannot
// express on their own (e.g. cross-field checks).
export const validateForm = (form: CouponFormFields): string => {
  if (!form.code?.trim()) {
    return "Please enter a coupon code";
  }
  if (!form.title?.trim()) {
    return "Please enter a title";
  }
  if (!form.applicableFor?.length) {
    return "Please choose who can use this coupon";
  }
  if (!form.validFrom) {
    return "Please select the Valid From date";
  }
  if (!form.validTill) {
    return "Please select the Valid Till date";
  }
  if (form.validTill < form.validFrom) {
    return "Valid Till date cannot be before Valid From date";
  }
  if (form.scopeType !== "CART" && !(form.scopeIds?.length > 0)) {
    return "Please select at least one item";
  }
  if (form.discountValue === "" || Number.isNaN(Number(form.discountValue))) {
    return "Please enter a discount value";
  }
  if (Number(form.discountValue) <= 0) {
    return "Discount value must be more than zero";
  }
  if (form.discountKind === "PERCENT" && Number(form.discountValue) > 100) {
    return "Percentage discount cannot be more than 100";
  }
  if (form.discountKind === "PERCENT") {
    if (
      form.maxDiscountPerUse === "" ||
      Number.isNaN(Number(form.maxDiscountPerUse))
    ) {
      return "Please enter the Max Discount Per Use";
    }
    if (Number(form.maxDiscountPerUse) <= 0) {
      return "Max Discount Per Use must be more than zero";
    }
  }

  if (form.minCartValue === "" || Number.isNaN(Number(form.minCartValue))) {
    return "Please enter the Min Cart Value";
  }
  if (Number(form.minCartValue) <= 0) {
    return "Min Cart Value must be more than zero";
  }

  return "";
};
