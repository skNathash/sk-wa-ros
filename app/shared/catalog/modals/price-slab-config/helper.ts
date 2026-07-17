export type TargetType = "global" | "menu" | "category" | "brand" | "product";

export interface Slab {
  fromQty: number;
  toQty: number;
  discount: number;
}

export interface PriceSlabFormValues {
  target?: any | null;
  fromQty: string | number | null;
  toQty: string | number | null;
  discount: string | number | null;
  status?: string | null;
  channel?: string | null;
}

export interface PriceSlabConfigModalProps {
  show: boolean;
  callback: (resp: { action: string; data?: any }) => void;
  type: TargetType;
  editId?: string;
  targetDetails?: {
    label: string;
    value: { id: string; name?: string; objId?: string };
  }[];
  slabs?: Slab[];
  channel?: "b2b" | "b2c";
  disableChannel?: boolean;
  initalTab?: "config" | "logs";
  hideTabs?: boolean;
}

export const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const channelOptions = [
  { value: "b2b", label: "B2B" },
  { value: "b2c", label: "B2C" },
];

export const headerMap: Record<TargetType, string> = {
  global: "Global Price Slab Config",
  menu: "Menu wise Price Slab Config",
  category: "Category wise Price Slab Config",
  brand: "Brand wise Price Slab Config",
  product: "Product wise Price Slab Config",
};

export const defaultValues = {
  target: [],
  fromQty: "",
  toQty: "",
  discount: "",
  status: "active",
  channel: "b2b",
};

import AuthService from "~/services/AuthService";

export function validate(
  formData: PriceSlabFormValues,
  slabs: Slab[],
  type: TargetType,
): { msg?: string } {
  if (!slabs || slabs.length === 0) {
    return { msg: "Add at least one slab" };
  }

  if (type !== "global") {
    const targetItem = formData?.target?.[0] || null;
    const id = targetItem?.value?.id;
    if (!targetItem || !id) {
      const targetLabels: Record<TargetType, string> = {
        global: "global",
        menu: "menu",
        category: "category",
        brand: "brand",
        product: "product",
      };
      const label = targetLabels[type] || "target";
      return { msg: `Please choose ${label}` };
    }
  }

  return {};
}

export function preparePayload(
  formData: PriceSlabFormValues,
  slabs: Slab[],
  type: TargetType,
) {
  const franchiseId = AuthService.getLoggedInUserId() || "";
  const targetItem = formData?.target?.[0] || null;
  let objectId = targetItem?.value?.objId || targetItem?.value?.objectId;

  if (type === "product" && targetItem) {
    objectId = targetItem.value?.id;
  }

  const configTypeMap: Record<TargetType, string> = {
    global: "Global",
    menu: "Menu",
    category: "Category",
    brand: "Brand",
    product: "Deal",
  };

  const configType = configTypeMap[type] || "Deal";

  const payload = {
    franchiseId,
    id: objectId,
    objectId,
    configType,
    pricingType: "Percentage",
    applicableFor: formData.channel === "b2b" ? "Network" : "Customer",
    slab: slabs.map((s) => ({
      minQuantity: s.fromQty,
      maxQuantity: s.toQty,
      discountPercentage: s.discount,
      isActive: formData.status === "active",
    })),
    isActive: formData.status === "active",
  };

  return payload;
}

export function validateAddSlab(
  fromQty: any,
  toQty: any,
  discount: any,
  slabs: Slab[],
  editIndex?: number | null,
): { msg?: string } {
  if (fromQty === "" || fromQty == null) {
    return { msg: "Please enter From Qty" };
  }
  const f = Number(fromQty);
  if (isNaN(f)) {
    return { msg: "Please enter a valid From Qty" };
  }
  if (f < 0) {
    return { msg: "From Qty cannot be negative" };
  }

  if (toQty === "" || toQty == null) {
    return { msg: "Please enter To Qty" };
  }
  const t = Number(toQty);
  if (isNaN(t)) {
    return { msg: "Please enter a valid To Qty" };
  }
  if (t < 0) {
    return { msg: "To Qty cannot be negative" };
  }

  if (discount === "" || discount == null) {
    return { msg: "Please enter Discount" };
  }
  const d = Number(discount);
  if (isNaN(d)) {
    return { msg: "Please enter a valid Discount" };
  }
  if (d < 0) {
    return { msg: "Discount cannot be negative" };
  }

  if (t <= f) {
    return { msg: "To Qty must be greater than From Qty" };
  }

  // Check overlap
  const newSlab = { fromQty: f, toQty: t, discount: d } as Slab;
  for (let index = 0; index < slabs.length; index++) {
    const slab = slabs[index];
    if (editIndex !== undefined && editIndex !== null && editIndex === index) {
      continue;
    }
    if (
      (newSlab.fromQty >= slab.fromQty && newSlab.fromQty <= slab.toQty) ||
      (newSlab.toQty >= slab.fromQty && newSlab.toQty <= slab.toQty) ||
      (newSlab.fromQty <= slab.fromQty && newSlab.toQty >= slab.toQty)
    ) {
      return { msg: "Slab configuration overlaps with existing slabs" };
    }
  }

  // check for the same discount value
  const foundeSameDiscount = slabs.find(
    (s, index) => s.discount === newSlab.discount && index !== editIndex,
  );
  if (foundeSameDiscount) {
    return { msg: "Discount value should not be same" };
  }

  return {};
}
