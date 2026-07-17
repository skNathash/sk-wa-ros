import OmsService from "~/services/OmsService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

export const getData = async (id: string) => {
  // First, fetch the PO details using the id (which is the PO ID)
  let poDetails: any = null;
  let skOrderId: string | null = null;
  let products: any[] = [];

  try {
    const poResponse = await PurchaseOrderService.getDetails(id);
    if (poResponse && poResponse.data?.data) {
      poDetails = PurchaseOrderService.formatPurchaseOrderData(
        poResponse.data.data
      );
      skOrderId = poDetails.skOrderId;
      products = poDetails.items || [];
    }
  } catch (error) {
    console.error("Error fetching PO details:", error);
    throw new Error("Failed to fetch PO details");
  }

  if (!skOrderId) {
    throw new Error("SK Order ID not found in PO details");
  }

  // Now fetch the packages details using the skOrderId
  const response = await OmsService.getShippedPackagesFromSK({
    displayType: "list",
    filter: {
      orderId: skOrderId,
    },
  });
  const packages = response.data.data || [];

  return { packages, products, poDetails };
};

export const prepareProducts = (boxes: any[]) => {
  let products: any[] = [];

  boxes.forEach((box) => {
    box.items.forEach((item: any) => {
      const productIndex = products.findIndex((p) => p.dealId === item.dealId);
      if (productIndex === -1) {
        products.push({
          ...item,
          boxId: box.packageId,
          boxRefId: box.packageRefNo,
        });
      } else {
        products[productIndex].boxId = box.packageId;
        products[productIndex].boxRefId = box.packageRefNo;
      }
    });
  });

  return products;
};
