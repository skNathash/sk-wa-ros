export type PackConfigType = {
  packType: "Ladi" | "InnerCase" | "Case" | "Unit";
  quantity: number | null;
  isDefault?: boolean;
  allowCaseQtyOverride?: boolean;
};

export type FormType = {
  products: Array<{
    _id?: string;
    originalPackConfig?: any;
    formData: {
      packageType: string;
      packageQty: number | null;
      allowPackageQtyOverride: boolean;
    };
    dealInfo: {
      dealName: string;
      dealRefId: string;
      dealId: string;
      images: string[];
      mrp: number;
      purchasePrice: number;
      b2bPrice: number;
      quantity?: number;
    };
  }>;
};

export const validate = (products: any[]) => {
  let msg = "";
  let index = -1;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    const packageType = product.formData?.packageType;
    const packageQty = product.formData?.packageQty;

    if (!packageType || packageType === "Choose") {
      index = i;
      msg = `Please select Sell In for "${product.dealInfo?.dealName || "Product"}"`;
      break;
    }

    if (packageType !== "Unit" && (packageQty == null || packageQty <= 0)) {
      index = i;
      msg = `Package quantity must be greater than 0 for "${product.dealInfo?.dealName || "Product"}"`;
      break;
    }
  }
  return { msg, index };
};
