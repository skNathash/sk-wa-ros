export const prepareItems = (items: any[], orderItems?: any[]) => {
  // Filter out cancelled items and use remainingQty instead of orderedQty
  return items
    .filter((item) => item.status !== "Cancelled")
    .map((item) => {
      const pendingQty = item.orderedQty - (item.pickedQty || 0);

      // Carry the edited/override price from the order item (set in POS
      // billing) so the picking UI can inform that price won't change.
      const orderItem = orderItems?.find((oi) => oi.dealId === item.dealId);

      return {
        ...item,
        _pendingQty: pendingQty,
        orderedQty: item.orderedQty || 0,
        overridePrice: orderItem?.overridePrice ?? null,
        percentage: caluclatePercentage(
          item.pickedQty || 0,
          item.orderedQty || 0,
        ),
      };
    });
};

export const caluclatePercentage = (pickedQty: number, orderedQty: number) => {
  return orderedQty > 0 ? (pickedQty / orderedQty) * 100 : 0;
};

import CommonService from "~/services/CommonService";

export const getTotalPickedItems = (items: any[]) => {
  const entries = items
    .filter((item) => item.status !== "Cancelled")
    .map((item) => ({
      uom: item.selectedStockUom || "unit",
      qty: item.pickedQty || 0,
    }));
  return CommonService.groupQtyByUom(entries).label || "0 units";
};

export const getTotalOrderedItems = (items: any[]) => {
  const entries = items
    .filter((item) => item.status !== "Cancelled")
    .map((item) => ({
      uom: item.selectedStockUom || "unit",
      qty: item.remainingQty || item.orderedQty || 0,
    }));
  return CommonService.groupQtyByUom(entries).label || "0 units";
};
