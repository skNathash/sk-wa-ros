import SellerService from "~/services/SellerService";

export const getPackingData = async (orderId: string) => {
  try {
    const response = await SellerService.getOrderBoxes(orderId);
    const boxes = response.data.data || [];
    const packingData = boxes.map((box: any) => ({
      id: box._id,
      name: box.packageRefNo,
      items: box.items,
    }));
    return packingData;
  } catch (error) {
    console.error("Error in getPackingData:", error);
    return [];
  }
};

/**
 * Reduce pickDetails snapshots quantities by the snapshots already present in boxes for an order.
 * - Fetches packing data (boxes) for the orderId
 * - Aggregates snapshot quantities from all boxes
 * - Subtracts those quantities from the provided pickDetails snapshots (consuming box quantities as applied)
 * - Removes any snapshot entries with quantity <= 0 and any pickDetail records that become empty
 *
 * @param orderId - Order id used to fetch boxes
 * @param pickDetails - Array of pick detail objects, each having snapshots: [{ snapshotId, quantity }]
 * @returns filtered pickDetails with adjusted snapshot quantities
 */
export const reducePickDetailsByBoxes = async (
  orderId: string,
  pickDetails: Array<any>
) => {
  if (!orderId || !Array.isArray(pickDetails)) return [];

  // Fetch boxes (packing) for the order and aggregate snapshot quantities
  const boxes = await getPackingData(orderId);

  const boxSnapshotQty: Record<string, number> = {};

  (boxes || []).forEach((box: any) => {
    const items = box.items || [];
    items.forEach((item: any) => {
      const snaps = item.snapshots || [];
      snaps.forEach((s: any) => {
        // tolerate different field names for id and quantity
        const id = s.id;
        const qty = Number(s.quantity ?? 0) || 0;
        if (!id || qty <= 0) return;
        boxSnapshotQty[id] = (boxSnapshotQty[id] || 0) + qty;
      });
    });
  });

  // If no snapshots in boxes, return the original filtered pickDetails (remove any zero qty snapshots)
  if (Object.keys(boxSnapshotQty).length === 0) {
    return pickDetails
      .map((p: any) => ({
        ...p,
        snapshots: (p.snapshots || []).filter(
          (s: any) => (s.quantity ?? 0) > 0
        ),
      }))
      .filter((p: any) => (p.snapshots || []).length > 0);
  }

  // Reduce pickDetails snapshots by consuming boxSnapshotQty for matching snapshot ids
  const result: Array<any> = [];

  pickDetails.forEach((p: any) => {
    const currentSnapshots = p.snapshots || [];
    const newSnapshots: any[] = [];

    currentSnapshots.forEach((s: any) => {
      const id = s.snapshotId;
      let qty = Number(s.quantity ?? 0) || 0;
      if (!id || qty <= 0) return; // nothing to keep

      const availableToConsume = boxSnapshotQty[id] || 0;
      if (availableToConsume > 0) {
        const take = Math.min(availableToConsume, qty);
        qty = qty - take;
        boxSnapshotQty[id] = availableToConsume - take;
      }

      if (qty > 0) {
        // preserve original shape (prefer snapshotId key)
        const out: any = { ...(s || {}) };
        if (out.snapshotId === undefined) out.snapshotId = id;
        out.quantity = qty;
        // remove alternative qty keys to keep consistent shape
        delete out.qty;
        newSnapshots.push(out);
      }
    });

    if (newSnapshots.length > 0) {
      result.push({ ...p, snapshots: newSnapshots });
    }
  });

  return result;
};
