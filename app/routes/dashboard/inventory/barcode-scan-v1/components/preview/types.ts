export type PreviewItem = {
  dealId: string | null;
  dealName: string;
  mrp: number;
  images: string[];
  dealRefId: string;
  oldBarcode: string[];
  barcode: string;
  qty: number;
  applicableCategory?: { id?: string; categoryId?: string; categoryName?: string };
  applicableBrand?: { id?: string; brandId?: string; brandName?: string };
  applicableMenu?: { id?: string; menuId?: string; menuName?: string };
  uom: string;
  isSubscribed: boolean;
  subscriptionStatus: string;
  status: "Valid" | "Invalid" | string;
  validationMessage: string;
  rowNumber: number;
  sentForApproval?: boolean;
};

export type PreviewGroups = {
  subscribed: PreviewItem[];
  notSubscribed: PreviewItem[];
  newProducts: PreviewItem[];
};

export const groupItems = (items: PreviewItem[]): PreviewGroups => {
  const subscribed: PreviewItem[] = [];
  const notSubscribed: PreviewItem[] = [];
  const newProducts: PreviewItem[] = [];
  for (const it of items) {
    if (it.status === "Invalid" || !it.dealId) newProducts.push(it);
    else if (it.isSubscribed) subscribed.push(it);
    else notSubscribed.push(it);
  }
  return { subscribed, notSubscribed, newProducts };
};
