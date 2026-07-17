import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import RackBinService from "~/services/RackBinService";
import SellerService from "~/services/SellerService";

export const getData = async (orderId: string) => {
  const orderResp = await OmsService.getSellerOrderDetail(orderId);
  // Extract pickingId from order response
  const pickingId = orderResp.data?.data?.activePicking?.id;

  // Fetch picking details
  const pickingResponse = await RackBinService.getPickingDetail(pickingId);

  // Fetch boxes for this order so we can ignore snapshots already moved to box
  let boxesResponse: any = null;
  try {
    boxesResponse = await SellerService.getOrderBoxes(orderId, {
      filter: {
        status: { $nin: ["Cancelled", "Closed"] },
      },
    });
  } catch (e) {
    console.warn("getData - failed fetching boxes for order:", e);
  }

  const items = orderResp.data?.data?.items || [];

  // Build a map from dealId -> array of snapshots from picking response
  const pickingItems = pickingResponse?.data?.data?.items || [];
  const boxes = boxesResponse?.data?.data || [];

  const snapshotsMap: Record<string, any> = {};

  boxes?.forEach((b: any) => {
    b.items?.forEach((it: any) => {
      it.snapshots?.forEach((s: any) => {
        const key = String(s.id ?? "");
        if (!snapshotsMap[key]) {
          snapshotsMap[key] = { quantity: 0 };
        }
        snapshotsMap[key].quantity += Number(s.quantity ?? 0) || 0;
      });
    });
  });

  pickingItems.forEach((it: any) => {
    it.snapshots?.forEach((s: any) => {
      const key = String(s.snapshotId ?? "");
      if (snapshotsMap[key]) {
        s.quantity -= snapshotsMap[key].quantity;
        if (s.quantity < 0) {
          s.quantity = 0;
        }
      }
    });
  });

  const finalPickingItems = pickingItems.filter((it: any) => {
    const snaps = Array.isArray(it.snapshots) ? it.snapshots : [];
    const validSnaps = snaps.filter((s: any) => Number(s?.quantity ?? 0) > 0);
    return validSnaps.length > 0;
  });

  // For each order item, group snapshots by mrp and attach `mrps` array
  // Ignore products which do not have any snapshots data
  const enrichedItems = (items || [])
    .map((item: any) => {
      const snapshots =
        finalPickingItems.find((it: any) => {
          return String(it.dealId ?? "") === String(item.dealId ?? "");
        })?.snapshots || [];

      // Group snapshots by mrp value and keep the original snapshot objects
      const mrpToSnapshots: Record<string, any[]> = {};
      snapshots.forEach((snap: any) => {
        const mrpVal = Number(snap?.mrp);
        const qty = Number(snap?.quantity ?? 0) || 0;
        if (!Number.isFinite(mrpVal) || qty <= 0) return;
        const key = String(mrpVal);
        if (!mrpToSnapshots[key]) mrpToSnapshots[key] = [];
        mrpToSnapshots[key].push(snap);
      });

      const uom = item?.selectedStockUom || "unit";

      const mrps = Object.keys(mrpToSnapshots).map((key) => {
        const snaps = mrpToSnapshots[key] || [];
        const totalQty = snaps.reduce(
          (sum: number, s: any) => sum + (Number(s.quantity ?? 0) || 0),
          0,
        );
        return {
          mrp: Number(key),
          quantity: totalQty,
          displayQuantity: totalQty,
          snapshots: snaps,
          uom,
          displaySummary:
            CommonService.groupQtyByUom([{ uom, qty: totalQty }]).label ||
            "0 units",
        };
      });

      const remainingQty = Number(item?.remainingQty ?? 0) || 0;
      const displaySummary =
        CommonService.groupQtyByUom([{ uom, qty: remainingQty }]).label ||
        "0 units";

      return {
        ...item,
        pickingId,
        mrps,
        uom,
        displaySummary,
        rawPickingSnapshots: snapshots,
      };
    })
    .filter((item: any) => (item.mrps || []).length > 0); // Ignore items without mrps

  return {
    items: enrichedItems,
    pickingId,
  };
};
