export const priceModeOptions = [
  { value: "fixed", label: "Fixed Price" },
  { value: "on_mrp", label: "On MRP" },
];

export type PriceFormData = {
  price: number | null;
  type: "fixed" | "on_mrp";
  discount?: number | null;
  profit: number;
};

export type FormType = {
  products: Array<{
    _id?: string;
    formData: PriceFormData;
    dealInfo: {
      dealName: string;
      dealRefId: string;
      dealId: string;
      images: string[];
      mrp: number;
      purchasePrice: number;
      b2bPrice: number;
      tax: number;
    };
  }>;
};

export const validateForm = (formData: PriceFormData) => {
  if (!formData.type) return "Price type is required";

  if (formData.type === "fixed") {
    if (formData.price === null || formData.price === undefined) {
      return "Price is required";
    }
    if (typeof formData.price !== "number" || isNaN(formData.price)) {
      return "Price must be a number";
    }
    if (formData.price <= 0) {
      return "Price must be greater than 0";
    }
  }

  if (formData.type === "on_mrp") {
    if (
      formData.discount === null ||
      formData.discount === undefined ||
      typeof formData.discount !== "number" ||
      isNaN(formData.discount)
    ) {
      return "Discount is required";
    }
    if (formData.discount < 0 || formData.discount > 100) {
      return "Discount must be between 0 and 100";
    }
  }

  return "";
};

export const validate = (products: any[]) => {
  let msg = "";
  let index = -1;
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const error = validateForm(product.formData);
    if (error) {
      index = i;
      msg = `${error} for "${product.dealInfo.dealName}"`;
      break;
    }
  }
  return { msg, index };
};
