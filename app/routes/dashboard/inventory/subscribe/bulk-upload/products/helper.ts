import BulkUploadService from "~/services/BulkUploadService";
import SellerCatalogService from "~/services/SellerCatalogService";

export interface BulkUploadProduct {
  name: string;
  brand: string;
  category: string;
  mrp: number;
  price: number;
  unit: string;
  barcode: string;
  qty: number;
  status?: string;
  statusVariant?: "success" | "warning" | "danger" | "primary" | "default";
  importId?: string;
  dealId?: string;
  dealRef?: string;
  dealRefId?: string;
  hsn?: string;
  gst?: number;
  images?: string[];
  error?: string;
  isSubscribed?: boolean;
}

export const getStatusBadgeVariant = (
  status?: string,
): NonNullable<BulkUploadProduct["statusVariant"]> => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized || normalized === "-") return "default";
  if (["approved", "success", "completed", "done"].includes(normalized)) {
    return "success";
  }
  if (
    ["pending", "in progress", "processing", "submitted"].includes(normalized)
  ) {
    return "warning";
  }
  if (["invalid", "rejected", "failed", "error"].includes(normalized)) {
    return "danger";
  }
  if (["subscribed", "already subscribed"].includes(normalized)) {
    return "warning";
  }
  return "primary";
};

export const parseDealIds = (raw: string | undefined | null): string[] => {
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((t) => String(t || "").trim())
    .filter((t) => t.length > 0);
};

const pickBarcode = (record: any): string => {
  if (Array.isArray(record?.barcodes)) return record.barcodes[0] || "";
  if (Array.isArray(record?.barcode)) return record.barcode[0] || "";
  return record?.barcode || "";
};

// Normalises a single record (from either the deal-upload status API or
// transformed getDeals response) into the shape the existing Preview UI expects.
export const formatDealRecord = (record: any): BulkUploadProduct => {
  const isSubscribed = Boolean(record?.isSubscribed);
  let status = String(record?.status || "VALID").toUpperCase();
  if (isSubscribed && status !== "INVALID") {
    status = "SUBSCRIBED";
  }
  return {
    isSubscribed,
    name: record?.name || record?.dealName || "",
    brand: record?.applicableBrand?.brandName || record?.brand?.name || "",
    category:
      record?.applicableCategory?.categoryName || record?.category?.name || "",
    mrp: Number(record?.mrp) || 0,
    price: Number(record?.b2bPrice ?? record?.price ?? record?.mrp) || 0,
    unit: record?.uom || record?.unit || "",
    barcode: pickBarcode(record),
    qty: Number(record?.qty) || 0,
    status,
    statusVariant: getStatusBadgeVariant(status),
    importId: record?._id || "",
    dealId: record?.dealId || "",
    dealRef: record?.dealRefId || record?.dealRef || record?.dealId || "",
    dealRefId: record?.dealRefId || record?.dealRef || "",
    hsn: record?.hsn || record?.hsnNumber || "",
    gst: Number(record?.gst ?? record?.tax) || 0,
    images: Array.isArray(record?.images) ? record.images : [],
    error: record?.validationMessage || record?.error || "",
  };
};

export const formatDealUploadRecords = (
  records: any[],
): BulkUploadProduct[] => {
  return (records || []).map(formatDealRecord);
};

export const getDealBatchStatus = async (
  batchId: string,
): Promise<BulkUploadProduct[]> => {
  const response = await BulkUploadService.getBatchStatus(batchId);
  const records = response?.data?.data?.records || [];
  return formatDealUploadRecords(records);
};

// Fetches deals by id using the standard deals API and transforms the response
// to match the deal-upload records shape. Missing ids are returned as INVALID
// rows so the Preview UI can surface them.
export const fetchDealsByIds = async (
  dealIds: string[],
): Promise<BulkUploadProduct[]> => {
  const unique = Array.from(new Set(dealIds.filter(Boolean)));
  if (unique.length === 0) return [];

  const response = await SellerCatalogService.bulkDealIdSearch(unique);
  const records: any[] = response?.data?.data || [];

  const byId = new Map<string, any>();
  records.forEach((r: any) => {
    const key = r?.dealRefId || r?.dealId;
    if (key) byId.set(String(key), r);
  });

  return unique.map((id) => {
    const record = byId.get(id);
    if (!record) {
      return formatDealRecord({
        dealId: id,
        status: "INVALID",
        validationMessage: "Deal ID not found",
      });
    }
    return formatDealRecord(record);
  });
};
