import PurchaseOrderService from "~/services/PurchaseOrderService";
import LogisticsService from "~/services/LogisticsService";
import AuthService from "~/services/AuthService";

export const prepareSkReceivePayload = (
  boxDetails: Record<string, any>,
  items: Array<any>,
  formData: Record<string, any>
) => {
  const payload: any = {
    invoiceId: boxDetails?.invoiceData?.refId || "",
    packageId: boxDetails.refNo || "",
    items: (items || []).map((e: any) => ({
      dealId: e.dealId,
      dealRefId: e.dealRefId,
      dealName: e.dealName || e.name || e.productName || "",
      receivedQuantity: Number(e.receivedQty) || 0,
      invoiceQuantity: Number(e.quantity) || 0,
      damagedQuantity: Number(e.damagedQty) || 0,
      damagedImages: [],
      shortageQuantity: Number(e.shortageQty) || 0,
      mrp: Number(e.mrp) || 0,
      purchasePrice: Number(e.price || 0),
      tax: Number(e.tax || 0),
      cgst: Number(e.cgst || 0),
      sgst: Number(e.sgst || 0),
      remarks: e.notes || formData.notes || "",
      barcode: e.snapshots?.[0]?.barcode || "",
    })),
    remarks: formData.notes || "",
  };
  return payload;
};

export const submitSkReceiveBox = async (
  orderId: string,
  params: Record<string, any>
) => {
  const res = await PurchaseOrderService.submitSkOrderReceipt(orderId, params);

  return {
    status: res.statusCode === 200 ? "success" : "error",
    msg:
      res.data?.message ||
      (res.statusCode === 200
        ? "Box received successfully"
        : "Failed to receive box"),
  };
};

/**
 * Prepare payload for seller package receive
 * Builds items array from products and attaches franchiseId
 */
export const prepareSellerReceivePayload = (
  boxDetails: Record<string, any>,
  products: Array<any>,
  formData: Record<string, any>
) => {
  const items: any[] = [];

  (products || []).forEach((e: any) => {
    (e.snapshots || []).forEach((s: any) => {
      const firstLoc =
        (e.locations && e.locations.length > 0 && e.locations[0]) || null;
      const locValue =
        (firstLoc && (firstLoc.location?.binId || firstLoc.binId)) || "";

      items.push({
        id: s.id,
        dealId: e.dealId,
        quantity: s.quantity,
        remarks: e.notes || formData.notes || "",
        location: locValue,
        damagedQuantity: Number(e.damagedQty) || 0,
        shortageQuantity: Number(e.shortageQty) || 0,
      });
    });
  });

  return {
    franchiseId: AuthService.getLoggedInUserId(),
    items,
  };
};

/**
 * Submit seller package receive using LogisticsService.receiveBox
 */
export const submitSellerReceiveBox = async (
  packageId: string,
  params: Record<string, any>
) => {
  const res = await LogisticsService.receiveBox(packageId, params);

  return {
    status: res.statusCode === 200 ? "success" : "error",
    msg:
      res.data?.message ||
      (res.statusCode === 200
        ? "Box received successfully"
        : "Failed to receive box"),
  };
};
