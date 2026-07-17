import SellerService from "~/services/SellerService";
import SellerCatalogService from "~/services/SellerCatalogService";
import RackBinService from "~/services/RackBinService";
import OmsService from "~/services/OmsService";

interface OrderItem {
  dealId: string;
  [key: string]: any;
}

interface OrderDetails {
  items?: OrderItem[];
  [key: string]: any;
}

interface DealProduct {
  _id: string;
  dealId?: string;
  [key: string]: any;
}

/**
 * Fetches order details and retrieves the corresponding deal products
 * @param orderId - The order ID to fetch details for
 * @returns Promise with order details and matched deal products
 */
export const getDetails = async (orderId: string) => {
  try {
    // Step 1: Fetch order details
    const orderResponse = await SellerService.getSellerOrderDetail(orderId);

    if (!orderResponse.data?.data) {
      throw new Error("Failed to fetch order details");
    }

    const orderDetails: OrderDetails = OmsService.formatOrderResponse([
      orderResponse.data.data,
    ])[0];
    const items = orderDetails.items || [];

    // Step 2: Fetch order boxes
    let boxes: any[] = [];
    try {
      const boxesResponse = await SellerService.getOrderBoxes(orderId, {
        filter: {
          status: {
            $nin: ["Cancelled"],
          },
        },
      });
      if (boxesResponse.statusCode === 200 && boxesResponse.data) {
        boxes = boxesResponse.data?.data || [];
      }
    } catch (boxError) {
      console.warn("Failed to fetch order boxes:", boxError);
      // Continue without boxes if the API call fails
    }

    // Step 3: Extract dealIds from order items
    const dealIds = items
      .filter((item: OrderItem) => item.dealId)
      .map((item: OrderItem) => item.dealId);

    if (dealIds.length === 0) {
      return {
        order: orderDetails,
        deals: [],
        boxes,
      };
    }

    // Step 4: Fetch deal products using $in filter
    const dealsResponse = await SellerCatalogService.getProducts({
      filter: {
        dealId: { $in: dealIds },
        ...(orderDetails.isKcStore && { isKCStoreEnabled: true }),
      },
    });

    if (!dealsResponse.data?.data) {
      return {
        order: orderDetails,
        deals: [],
        boxes,
      };
    }

    // Step 5: Format the deals response
    const deals = SellerCatalogService.formatProductResponse(
      dealsResponse.data.data || [],
    );

    // Step 6: Fetch picking details for the order and build a map of picked quantities
    // and pickDetails (array of picking items) by dealId
    let pickedMap: Record<string, { pickedQty: number; pickDetails: any[] }> =
      {};
    try {
      const pickingResponse = await RackBinService.getPickingDetail(
        orderDetails?.activePicking?.id,
      );
      if (pickingResponse.statusCode === 200 && pickingResponse.data?.data) {
        const pickings = [pickingResponse.data?.data];
        // pickings is expected to be an array like [{ items: [{ dealId, pickedQty, snapshots, ... }] }]
        pickings.forEach((p: any) => {
          (p.items || []).forEach((it: any) => {
            const id = it.dealId;
            const qty = Number(it.pickedQty) || 0;
            if (!id) return;
            if (!pickedMap[id]) {
              pickedMap[id] = { pickedQty: 0, pickDetails: [] };
            }
            pickedMap[id].pickedQty += qty;
            // store the raw picking item for detail (snapshots, pickslip refs, user, etc.)
            pickedMap[id].pickDetails.push({
              ...it,
              pickingId: p._id,
            });
          });
        });
      }
    } catch (pickErr) {
      console.warn("Failed to fetch picking details:", pickErr);
    }

    // Step 6.1: Build a map of scanned quantities by dealId from boxes response
    // boxes is expected to be an array like [{ items: [{ dealId, qty }] }]
    const scannedMap: Record<string, number> = {};
    try {
      (boxes || []).forEach((b: any) => {
        (b.items || []).forEach((it: any) => {
          const id = it.dealId;
          const qty = Number(it.qty) || 0;
          if (!id) return;
          scannedMap[id] = (scannedMap[id] || 0) + qty;
        });
      });
    } catch (scanErr) {
      console.warn("Failed to compute scanned quantities from boxes:", scanErr);
    }

    // Step 7: Match deals with order items using dealId and attach pickedQty and pickDetails
    const matchedDeals = items.map((item: OrderItem) => {
      const matchedDeal = deals.find(
        (deal: DealProduct) => deal._id === item.dealId,
      );
      const pickEntry = pickedMap[item.dealId] || {
        pickedQty: 0,
        pickDetails: [],
      };
      return {
        ...item,
        dealDetails: matchedDeal || null,
        pickedQty: pickEntry.pickedQty || 0,
        pickDetails: pickEntry.pickDetails || [],
        scannedQty: scannedMap[item.dealId] || 0,
      };
    });

    return {
      order: orderDetails,
      deals: matchedDeals,
      boxes,
    };
  } catch (error) {
    console.error("Error in getDetails:", error);
    throw error;
  }
};
// Transform boxes API response to [{id, refId, status, products:[{name, id, refId, scannedQty}]}]
export function transformBoxesResponse(boxes: any[]) {
  return boxes.map((box) => ({
    id: box._id,
    refId: box.packageRefNo,
    status: box.status || "Open", // Include status field from API response
    createdAt: box.createdAt,
    createdBy: box.createdBy,
    products: (box.items || []).map((item: any) => ({
      name: item.dealName,
      id: item.dealId,
      refId: item.dealRefId,
      scannedQty: item.scannedQty || item.qty, // Use scannedQty if available, fallback to qty
    })),
  }));
}

export function updateBoxesWithSnapshot(
  product: any,
  boxes: any[],
  currentBoxId: string,
  snapshot: any,
) {
  return boxes.map((box: any) => {
    if (box.id !== currentBoxId) return box;
    const existingProductIndex = box.products.findIndex(
      (p: any) => p.id === product.dealId,
    );

    let updatedProducts;
    if (existingProductIndex !== -1) {
      updatedProducts = box.products.map((p: any, idx: number) => {
        if (idx !== existingProductIndex) return p;
        // Always flatten snapshots to avoid array of arrays
        let newSnapshots = Array.isArray(p.snapshots) ? p.snapshots : [];
        newSnapshots = [...newSnapshots, snapshot];
        newSnapshots = newSnapshots.flat();
        // Calculate scannedQty from usedQty in snapshots.masters[]
        let scannedQty = 0;
        newSnapshots.forEach((snap: any) => {
          if (Array.isArray(snap.masters)) {
            scannedQty += snap.masters.reduce(
              (sum: number, m: any) => sum + (m.usedQty || 0),
              0,
            );
          }
        });
        return {
          ...p,
          snapshots: newSnapshots,
          detail: product,
          scannedQty,
        };
      });
    } else {
      // Calculate scannedQty from usedQty in snapshot.masters[]
      let scannedQty = 0;
      if (Array.isArray(snapshot)) {
        snapshot.forEach((snap: any) => {
          if (Array.isArray(snap.masters)) {
            scannedQty += snap.masters.reduce(
              (sum: number, m: any) => sum + (m.usedQty || 0),
              0,
            );
          }
        });
      } else if (snapshot && Array.isArray(snapshot.masters)) {
        scannedQty = snapshot.masters.reduce(
          (sum: number, m: any) => sum + (m.usedQty || 0),
          0,
        );
      }

      updatedProducts = [
        ...box.products,
        {
          name: product.dealName,
          id: product.dealId,
          refId: product.dealRefId,
          requiredQty: product.pickedQty,
          snapshots: snapshot,
          scannedQty,
        },
      ];
    }

    // Calculate totalProducts
    const totalProducts = updatedProducts.length;

    // Calculate totalUnits by summing usedQty in all snapshots.masters for all products
    let totalUnits = 0;
    updatedProducts.forEach((prod: any) => {
      // Snapshots are always flat now
      const flatSnapshots = Array.isArray(prod.snapshots) ? prod.snapshots : [];
      flatSnapshots.forEach((snap: any) => {
        if (Array.isArray(snap.masters)) {
          totalUnits += snap.masters.reduce(
            (sum: number, m: any) => sum + (m.usedQty || 0),
            0,
          );
        }
      });
    });

    // Update key (using box.id + totalProducts + totalUnits for uniqueness)
    const key = `${box.id}-${totalProducts}-${totalUnits}`;

    return {
      ...box,
      products: updatedProducts,
      totalProducts,
      totalUnits,
      key,
    };
  });
}
