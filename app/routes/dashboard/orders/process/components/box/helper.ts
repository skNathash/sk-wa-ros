import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import SellerService from "~/services/SellerService";

interface ScanInputResponse {
  status: "success" | "error";
  deal?: any;
  snapshots?: any[];
  message?: string;
}

export const handleScanInputAPI = async (
  barcode: string,
  orderId: string
): Promise<ScanInputResponse> => {
  try {
    const pickedResponse = await SellerService.getOrderPicking(orderId);

    const pickedItems = pickedResponse?.data?.data?.[0]?.items || [];

    const item = pickedItems.find((item: any) =>
      item.snapshots.some((snapshot: any) => snapshot.barcode === barcode)
    );

    const matchedSnapshot = item.snapshots.find(
      (snapshot: any) => snapshot.barcode === barcode
    );

    // Get master snapshot data for the deal
    const snapshotResp = await RackBinService.getSnapshotsMastersData(
      AuthService.getLoggedInUserId() || "",
      {
        filter: {
          quantity: { $gt: 0 },
          barcode,
          isUsable: true,
          dealId: item.dealId,
          _id: matchedSnapshot.snapshotId,
        },
      }
    );

    const snapshots = RackBinService.updateMasterDataWithUsedQuantities(
      snapshotResp.data?.data || [],
      item.snapshots
    );

    if (!snapshots.length) {
      return {
        status: "error",
        message: "No usable stock found for this product.",
      };
    }

    return {
      status: "success",
      deal: item,
      snapshots,
    };
  } catch (error) {
    console.error("Error in handleScanInputAPI:", error);
    return {
      status: "error",
      message: "Error scanning item.",
    };
  }
};

export function getTotalScannedQty(
  dealId: string,
  boxes: any[],
  currentBox?: any
): number {
  let total = 0;

  // If a currentBox is provided, include scanned qty from the current box
  if (currentBox && currentBox.products && currentBox.products.length) {
    const item = currentBox.products.find((p: any) => p.id === dealId);
    if (item) {
      total += item.scannedQty || 0;
    }
  }

  // Sum across provided boxes array (legacy/open boxes)
  const boxesQty = (boxes || []).reduce((totalBoxes: number, box: any) => {
    const boxItemsQty = (box.items || []).reduce(
      (itemTotal: number, item: any) => {
        if (item.dealId === dealId) {
          const snapshotsQty = (item.snapshots || []).reduce(
            (snapshotTotal: number, snapshot: any) => {
              return snapshotTotal + (snapshot.quantity || 0);
            },
            0
          );
          return itemTotal + snapshotsQty;
        }
        return itemTotal;
      },
      0
    );
    return totalBoxes + boxItemsQty;
  }, 0);

  total += boxesQty;
  return total;
}

export function prepareFinishBoxPayload(box: any) {
  return {
    items: box.products.map((product: any) => ({
      dealId: product.id,
      qty: product.scannedQty,
      mrp: product.snapshots?.[0]?.masters?.[0]?.mrp,
      snapshots: product.snapshots
        ? product.snapshots.flatMap((snapshot: any) =>
            (snapshot.masters || [])
              .filter((master: any) => master.usedQty > 0)
              .map((master: any) => ({
                id: master._id,
                dealId: product.id,
                barcode: master.barcode,
                mrp: master.mrp,
                expiry: master.expiry,
                manufactureDate: master.manufactureDate,
                quantity: master.usedQty,
              }))
          )
        : [],
    })),
  };
}

export async function createBox(orderId: string) {
  let boxId = "";
  let boxRefId = "";
  let errMsg = "";

  const response = await SellerService.getOrderBoxes(orderId, {
    filter: {
      status: "Open",
    },
  });
  const boxesArr = response?.data?.data || [];

  if (0 && boxesArr.length > 0) {
    boxId = boxesArr[0]._id;
    boxRefId = boxesArr[0].packageRefNo;
  } else {
    const payload = {
      orderId,
      packageType: "Medium",
      boxDetails: {
        weight: 0,
        height: 15.5,
        width: 12,
        length: 20,
      },
    };
    const createResp = await SellerService.openBox(payload);
    if (createResp.statusCode === 200 && createResp.data?.data?._id) {
      boxId = createResp.data.data._id;
      boxRefId = createResp.data.data.packageRefNo;
    } else {
      errMsg = createResp.data?.message || "Failed to open box.";
    }
  }

  return { id: boxId, refId: boxRefId, errMsg };
}

export async function fetchBoxes(orderId: string) {
  try {
    if (!orderId) return [];
    const resp = await SellerService.getOrderBoxes(orderId);
    const list = (resp && resp.data && resp.data.data) || [];
    const mapped = (list || []).map((b: any) => ({
      id: b._id,
      name: b.packageRefNo || b.refId || "-",
      items: Array.isArray(b.items)
        ? b.items.reduce((s: number, it: any) => s + (Number(it.qty) || 0), 0)
        : 0,
      status: b.status,
      raw: b,
    }));
    return mapped;
  } catch (e) {
    console.error("Error fetching boxes helper:", e);
    return [];
  }
}
