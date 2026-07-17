import CommonService from "~/services/CommonService";
import SellerService from "~/services/SellerService";
import OmsService from "~/services/OmsService";
import LogisticsService from "~/services/LogisticsService";

/**
 * Fetch box details by boxId, then fetch order details and prepare
 * an items array where each item contains `mps` (mrp groups) and snapshots.
 */
export const getData = async (boxId: string) => {
  if (!boxId) return { items: [], box: null, order: null };

  let box: any = null;
  try {
    const resp = await SellerService.getPackage(boxId);
    box = resp?.data?.data || {};
  } catch (e) {}

  // so if box is still null, return empty
  if (!box) return { items: [], box: null, order: null };

  // extract order id from known fields
  const orderId = box?.order?.id || "";

  let order: any = null;
  if (orderId) {
    try {
      const oresp = await SellerService.getSellerOrderDetail(String(orderId));
      order = oresp?.data?.data || null;
      if (order) {
        order = OmsService.formatOrderResponse([order])[0];
      }
    } catch (err) {
      console.warn("getData: failed fetching order details", err);
    }
  }

  const boxItems = Array.isArray(box.items) ? box.items : [];

  // Build dealId -> uom map from order deals (selectedStockUom)
  const dealUomMap: Record<string, string> = {};
  const orderDeals: any[] = Array.isArray(order?.deals) ? order.deals : [];
  orderDeals.forEach((d: any) => {
    if (d?.dealId) dealUomMap[d.dealId] = d.selectedStockUom || "unit";
  });

  // For each box item group snapshots by mrp to produce `mps` (mrp groups)
  const items = (boxItems || []).map((it: any) => {
    const snaps = Array.isArray(it.snapshots) ? it.snapshots : [];

    // group by mrp
    const mrpMap: Record<string, any[]> = {};
    snaps.forEach((s: any) => {
      if (!s) return;
      const mrpVal = Number(s?.mrp) || 0;
      const key = String(mrpVal);
      if (!mrpMap[key]) mrpMap[key] = [];
      mrpMap[key].push(s);
    });

    const mps = Object.keys(mrpMap).map((k) => {
      const arr = mrpMap[k] || [];
      const quantity = arr.reduce(
        (sum: number, a: any) => sum + (Number(a.quantity ?? a.qty ?? 0) || 0),
        0,
      );
      return {
        mrp: Number(k) || 0,
        quantity,
        snapshots: arr,
      };
    });

    const uom = dealUomMap[it.dealId] || "unit";
    const totalQty = Number(it.qty ?? 0) || 0;
    const displaySummary =
      CommonService.groupQtyByUom([{ uom, qty: totalQty }]).label ||
      "0 units";

    return {
      dealId: it.dealId,
      dealName: it.dealName || "",
      totalQty,
      remainingQty: Number(it.remainingQty ?? 0) || 0,
      mps,
      uom,
      displaySummary,
      raw: it,
    };
  });

  return {
    items,
    box,
    order,
  };
};

export default null;
