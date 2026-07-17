export type FormType = {
  products: Array<{
    _id?: string;
    formData: {
      enableReserve: "yes" | "no" | "";
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

    if (product.formData?.enableReserve === "") {
      index = i;
      msg = `Please select if you want to enable reserve for "${product.dealInfo.dealName}"`;
      break;
    }
  }
  return { msg, index };
};
