/* Monogram tile shown on pick rows in place of a product image (picking items
   don't carry one): brand-ish letter code + a deterministic accent color. */
const TILE_COLORS = [
  "#f59e0b",
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#0ea5e9",
  "#14b8a6",
  "#e11d48",
];

export const buildTile = (name = "") => {
  const words = name.split(/[\s-]+/).filter(Boolean);
  const letters = words
    .filter((word) => /^[a-z]/i.test(word))
    .map((word) => word[0])
    .join("");
  const numbers = name.match(/\d+/g);
  const size = numbers ? numbers[numbers.length - 1] : "";
  const lead = letters.length >= 2 ? letters : name.slice(0, 3);
  const code = (lead + size).toUpperCase().slice(0, 5) || "--";

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return { code, color: TILE_COLORS[hash % TILE_COLORS.length] };
};

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
        _tile: buildTile(item.dealName || item.name || ""),
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
