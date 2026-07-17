export interface ProductValidationData {
  name?: string;
  mrp?: number | string;
  unitType?: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

import CommonService from "~/services/CommonService";

export const validateProduct = (data: Record<string, any>) => {
  const mrp = Number(data.mrp);
  const needsModel = CommonService.shouldShowModelInput(
    data.category?.value?.name,
  );

  let msg = "";

  if (!data.name || data.name.trim() === "") {
    msg = "Item name is required";
  } else if (!data.mrp) {
    msg = "MRP is required";
  } else if (isNaN(mrp)) {
    msg = "MRP must be a number";
  } else if (mrp < 0) {
    msg = "MRP cannot be less than 0";
  } else if (!data.unitType) {
    msg = "Unit type is required";
  } else if (needsModel && (!data.model || data.model.trim() === "")) {
    msg = "Model is required";
  } else {
    msg = "";
  }
  return { msg };
};
