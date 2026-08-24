import InventorySubscribeService from "~/services/InventorySubscribeService";

export const UOM_OPTIONS = InventorySubscribeService.getUomOptions();
export const DEFAULT_UOM = UOM_OPTIONS[0]?.value || "piece";

export type SubscribeFormData = {
  mrp: number | "";
  purchasePrice: number | "";
  stock: number | "";
  sellingPrice: number | "";
  uom: string;
};

export const EMPTY_FORM: SubscribeFormData = {
  mrp: "",
  purchasePrice: "",
  stock: "",
  sellingPrice: "",
  uom: DEFAULT_UOM,
};

export const validateSubscribeForm = (
  data: SubscribeFormData,
): { msg: string } | null => {
  let msg = "";
  if (!data.uom) {
    msg = "Select the unit of measure";
  } else if (!(Number(data.mrp) > 0)) {
    msg = "Enter a valid MRP";
  } else if (!(Number(data.purchasePrice) > 0)) {
    msg = "Enter a valid purchase price";
  } else if (!(Number(data.stock) > 0)) {
    msg = "Enter the stock quantity";
  } else if (!(Number(data.sellingPrice) > 0)) {
    msg = "Enter a valid selling price";
  } else if (Number(data.purchasePrice) > Number(data.mrp)) {
    msg = "Purchase price cannot be greater than MRP";
  } else if (Number(data.sellingPrice) > Number(data.mrp)) {
    msg = "Selling price cannot be greater than MRP";
  }
  return msg ? { msg } : null;
};
