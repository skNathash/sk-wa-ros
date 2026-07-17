import BulkUploadService from "~/services/BulkUploadService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { VariantColor } from "~/types/CommonTypes";

export interface BarcodeDealType {
  dealId: string;
  refId: string;
  barcode: string[];
  dealName: string;
  mrp: number;
  status: "VALID" | "INVALID";
  statusColor: VariantColor;
  category: {
    categoryName: string;
    categoryId: string;
  };
  menu: {
    menuName: string;
    menuId: string;
  };
  brand: {
    brandName: string;
    brandId: string;
  };
  error?: string;
  isInCart?: boolean;
  isSubscribed?: boolean;
  subscribeError?: string;
  images?: string[];
}

export const getBatchStatus = async (batchId: string) => {
  const response = await BulkUploadService.getBatchStatus(batchId);

  const deals = response?.data?.data?.records || [];

  return formatBulkBarcodeResponse(deals);
};

export const handleProductSubscribe = async (product: BarcodeDealType) => {
  const response = await InventorySubscribeService.createRequest({
    dealId: product.dealId,
    quantity: 1,
    price: product.mrp,
  });

  if (response.statusCode === 200) {
    const product = response.data?.data || {};

    InventorySubscribeService.saveInLocalCart({
      dealId: product.dealId,
      dealName: product.dealName,
      quantity: 1,
      price: product.mrp,
      images: product.images,
      itemId: product.itemId,
    });
  }

  return {
    status: response.statusCode === 200 ? "success" : "error",
    message: response.data?.message || "Failed to subscribe product",
  };
};

export const subscribeAll = async (products: BarcodeDealType[]) => {
  const deals = products.map((product) => ({
    dealId: product.dealId,
    dealRefId: product.refId,
    name: product.dealName,
    quantity: 0,
    mrp: product.mrp,
    price: product.mrp,
    barcodes: product.barcode,
    images: product.images || [],
  }));
  const response = await InventorySubscribeService.bulkSubscription(deals);

  const failedDeals = response?.data?.data?.failed
    ?.map((item: any) => item.product?.dealId)
    .filter(Boolean);

  return {
    status: response.statusCode === 200 ? "success" : "error",
    message: response.data?.message || "Failed to subscribe products",
    failedDeals: failedDeals || [],
  };
};

export const formatBulkBarcodeResponse = (
  records: any[]
): BarcodeDealType[] => {
  return records.map(
    (deal: any) =>
      ({
        dealId: deal.dealId,
        refId: deal.dealRefId,
        barcode: Array.isArray(deal.barcode) ? deal.barcode : [deal.barcode],
        dealName: deal.dealName,
        mrp: deal.mrp,
        status: deal.status.toUpperCase(),
        category: deal.applicableCategory || {},
        menu: deal.applicableMenu || {},
        brand: deal.applicableBrand || {},
        error: deal.validationMessage || "",
        statusColor:
          deal.status?.toUpperCase() === "VALID" ? "success" : "danger",
        isSubscribed: deal.subscriptionStatus === "Subscribed",
        images: deal.images || [],
      } as BarcodeDealType)
  );
};

// utility: parse a raw barcode string into an array of trimmed, non-empty tokens
export const parseBarcodes = (raw: string | undefined | null): string[] => {
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((t) => String(t || "").trim())
    .filter((t) => t.length > 0);
};
