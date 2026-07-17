export type FormType = {
  products: Array<{
    _id?: string;
    formData: {
      isPromotionalDeal: "yes" | "no" | "";
    };
    dealInfo: {
      dealName: string;
      dealRefId: string;
      dealId: string;
      images: string[];
      mrp: number;
      quantity?: number;
    };
  }>;
};

export const validate = (products: any[]) => {
  let msg = "";
  let index = -1;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    if (product.formData?.isPromotionalDeal === "") {
      index = i;
      msg = `Please select if "${product.dealInfo.dealName}" is promotional (Yes or No)`;
      break;
    }
  }
  return { msg, index };
};
