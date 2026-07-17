import { each } from "lodash";
import ProductService from "~/services/ProductService";
import AuthService from "~/services/AuthService";
import type {
  DealInventorySnapshotType,
  ScanDealType,
} from "~/types/CommonTypes";

const useBarcodeScan = () => {
  const startScan = async (
    barcode: string,
    deals: Array<ScanDealType>,
    callback: (a: {
      snaps: Array<DealInventorySnapshotType>;
      status: string;
      errMsg?: string;
      deal?: {
        id: string;
        index: number;
      };
    }) => void
  ) => {
    let looseQty = 0;

    // if loose barcode then get qty from barcode
    if (/^.{5,}\#[0-9]{2,}$/gi.test(barcode)) {
      const b = barcode;
      barcode = b.split("#")[0];
      looseQty = Number(b.split("#")[1] || 0);
    }

    const dealResponse = await ProductService.getProducts({
      barcode: barcode,
      showColumns: ["inventoryNew", "_id", "name"],
      filter: {
        _id: { $in: deals.map((deal) => deal.id) },
      },
    });

    if (Array.isArray(dealResponse.data) && dealResponse.data.length > 0) {
      const validDeals = filterValidDeals(
        deals,
        formatDealResponse(dealResponse.data)
      );

      const result = getDealsToScan(barcode, validDeals, deals);

      if (result?.deal?.id) {
        const pickedInventory = pickInventoryRow(
          result.deal.inventoryNew,
          combineUsedSnapshots(deals),
          { barcode, mrp: result.deal.mrp }
        );

        if (pickedInventory.length) {
          callback({
            snaps: pickedInventory,
            status: "success",
            deal: {
              id: result.deal.id,
              index: result.index,
            },
          });
        } else {
          callback({
            snaps: [],
            status: "error",
            errMsg: "No inventory found",
            deal: {
              id: result.deal.id,
              index: result.index,
            },
          });
        }
      } else {
        if (result.fulfilledDealName) {
          callback({
            snaps: [],
            status: "error",
            errMsg: `You have already scanned all items for ${result.fulfilledDealName}`,
          });
        } else {
          callback({
            snaps: [],
            status: "error",
            errMsg: "No inventory found",
          });
        }
      }
    } else {
      callback({
        snaps: [],
        status: "error",
        errMsg: "No deals found",
      });
    }
  };

  return { startScan };
};

function formatDealResponse(dealsResponse: any) {
  const user = AuthService.getLoggedInUser();

  return dealsResponse.map((deal: any) => {
    return {
      ...deal,
      inventoryNew: deal.inventoryNew
        .filter(
          (i: any) => i.sellerInfo?._id === AuthService.getLoggedInSellerId()
        )
        .map((i: any) => ({
          ...i,
        })),
    };
  });
}

function filterValidDeals(deals: Array<ScanDealType>, dealsResponse: any) {
  return dealsResponse.filter((deal: any) => {
    const dealResponse = deals.find((d: any) => d.id === deal.id);

    if (dealResponse?.id) {
      const inventory = deal.inventoryNew || [];
      const inventoryNew = inventory.filter((i: any) => i.sellableQty > 0);
      deal.inventoryNew = inventoryNew;

      return deal.inventoryNew.length > 0;
    }
    return false;
  });
}

function getDealsToScan(
  barcode: string,
  validDeals: Array<any>,
  deals: Array<ScanDealType>
) {
  let selectedDeal = {
    id: "",
    inventoryNew: [],
    mrp: 0,
  };
  let index = -1;
  let fulfilledDealName = "";

  each(validDeals, (deal) => {
    const inventory = deal.inventoryNew || [];
    const matchedDeal = inventory.find((item: any) => item.barcode === barcode);
    if (matchedDeal) {
      const sIndex = deals.findIndex((d) => d.id === deal.id);

      if (sIndex === -1) {
        return;
      }

      if (deals[sIndex].scannedQuantity >= deals[sIndex].quantity) {
        fulfilledDealName = deal.name || "this product";
        return true;
      }

      index = sIndex;

      selectedDeal = {
        id: deal.id,
        inventoryNew: deal.inventoryNew,
        mrp: deals[sIndex].mrp,
      };

      return false;
    } else {
      return true;
    }
  });

  return {
    deal: selectedDeal,
    index,
    fulfilledDealName,
  };
}

function combineUsedSnapshots(deals: Array<ScanDealType>) {
  return deals.flatMap((deal) => deal.snapshots);
}

function pickInventoryRow(
  inventory: Array<any>,
  usedSnapshots: Array<DealInventorySnapshotType>,
  dealDetails: { mrp: number; barcode: string }
): Array<DealInventorySnapshotType> {
  // Reduce sellableQuantity based on used snapshots

  usedSnapshots.forEach((snapshot) => {
    const inventoryItem = inventory.find((item) => item._id === snapshot.id);
    if (inventoryItem) {
      inventoryItem.sellableQty -= snapshot.scannedQuantity;
    }
  });

  // Filter inventory to keep only items with sellableQuantity > 0
  const filteredInventory = inventory.filter((item) => item.sellableQty > 0);

  // Try to find items matching the barcode
  let matchedItems = filteredInventory.filter(
    (item) =>
      item.barcode === dealDetails.barcode && item.mrp === dealDetails.mrp
  );

  if (!matchedItems.length) {
    matchedItems = filteredInventory.filter(
      (item) => item.barcode === dealDetails.barcode
    );
  }

  if (!matchedItems.length) {
    matchedItems = filteredInventory.filter(
      (item) => item.mrp === dealDetails.mrp
    );
  }

  return transformInventoryToSnapshots(matchedItems);
}

function transformInventoryToSnapshots(
  inventory: Array<any>
): Array<DealInventorySnapshotType> {
  return inventory.map((item) => ({
    id: item._id,
    quantity: item.quantity,
    scannedQuantity: 1,
    mrp: item.mrp,
    sellableQty: item.sellableQty,
    barcode: item.barcode,
    expiry: item.expiry,
    inventoryType: item.inventoryType,
    b2bPrice: item.b2bPrice,
    purchasePrice: item.purchasePrice,
    tax: item.tax,
    dealId: item.dealId,
    blockedQty: item.blockedQty,
    sellerInfo: item.sellerInfo,
  }));
}

export default useBarcodeScan;
