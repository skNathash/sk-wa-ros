export const calculateOnOptions = [
  {
    value: "beforeTax",
    label: "on Before Tax",
  },
  {
    value: "afterTax",
    label: "on After Tax",
  },
];

export type PriceFormData = {
  offerDiscount: number | null;
  offerStartDate: string | null;
  offerEndDate: string | null;
  schemePrice: number;
  profit: number;
  calculateOn: string;
};

export type FormType = {
  products: Array<{
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
      additionalCess: number;
    };
  }>;
};

export const validateForm = (formData: PriceFormData) => {
  let msg = "";

  if (!formData.offerDiscount || formData.offerDiscount < 0) {
    msg = "Scheme discount is required";
  } else if (!formData.offerStartDate) {
    msg = "Scheme start date is required";
  } else if (!formData.offerEndDate) {
    msg = "Scheme end date is required";
  } else if (formData.offerStartDate > formData.offerEndDate) {
    msg = "Scheme start date cannot be greater than scheme end date";
  } else if (!formData.calculateOn) {
    msg = "Calculate on is required";
  } else {
    msg = "";
  }

  return msg;
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
