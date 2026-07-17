import PurchaseOrderService from "~/services/PurchaseOrderService";
import VendorService from "~/services/VendorService";
import AuthService from "~/services/AuthService";

export async function getData(id: string, params: Record<string, any> = {}) {
  const response = await PurchaseOrderService.getDetails(id, params);

  if (response && response.data?.data) {
    const formattedData = PurchaseOrderService.formatPurchaseOrderData(
      response.data?.data || {}
    );

    // Try to fetch full vendor details when possible and attach as vendorInfo
    let vendorInfo: any = formattedData.vendorInfo || null;
    try {
      const vendorId = formattedData.vendorDetails?.id;

      if (vendorId) {
        const vResp = await VendorService.getDetail(String(vendorId));
        if (vResp && vResp.data && vResp.data.data) {
          vendorInfo = vResp.data.data;
        }
      }
    } catch (err) {
      // ignore vendor fetch errors and continue with existing vendor info
      console.error("Failed to fetch vendor details for PO view:", err);
    }

    // attach default boxes counts. For SK orders, try to fetch actual counts
    const boxes: { needToReceive: number; received: number } = {
      needToReceive: 0,
      received: 0,
    };

    if (formattedData._isFromSk && formattedData.skOrderId) {
      try {
        const receiverId = AuthService.getLoggedInUserId() || "";
        const baseCountPayload: Record<string, any> = {
          filter: { "orderData.id": formattedData._id },
          outputType: "count",
        };

        const [notReceivedResp, receivedResp] = await Promise.all([
          PurchaseOrderService.getPoPackages(receiverId, {
            ...baseCountPayload,
            filter: { ...baseCountPayload.filter, status: "Shipped" },
          }),
          PurchaseOrderService.getPoPackages(receiverId, {
            ...baseCountPayload,
            filter: { ...baseCountPayload.filter, status: "Delivered" },
          }),
        ]);

        boxes.needToReceive = notReceivedResp?.data?.data?.count || 0;
        boxes.received = receivedResp?.data?.data?.count || 0;
      } catch (err) {
        console.error("Failed to fetch boxes counts for PO view:", err);
      }
    }

    return {
      ...formattedData,
      boxes,
      vendorInfo,
      orderInfo: {
        purchaseOrder: formattedData,
        orderId: formattedData._id,
        status: formattedData.status,
        totalValue: formattedData.payableAmount,
        totalItems: formattedData._totalItems,
        vendorName: formattedData.vendorDetails?.name,
        createdAt: formattedData.createdAt,
        expectedDeliveryDate: formattedData.expectedDeliveryDate,
        actualDeliveryDate: formattedData.actualDeliveryDate,
        updatedAt: formattedData.updatedAt,
        notes: formattedData.notes,
      },
      financeInfo: {
        totalProducts: formattedData.items?.length || 0,
        totalUnits: formattedData._totalQuantity,
        orderValue: formattedData.payableAmount,
        invoiceNo: formattedData.invoiceDetails?.refno || "",
        invoiceAmount: formattedData.invoiceDetails?.amount || 0,
        paymentStatus: formattedData?.paymentStatus || "",
        allItemsReceived:
          (formattedData.poSummary?.items || 0) ===
          (formattedData.items?.length || 0),
        paymentSummary: formattedData.paymentSummary || [],
        invoiceDetails: formattedData.invoiceDetails || [],
        commissionDetails: formattedData.commissionDetails || null,
        subscriptionPlanInfo: formattedData.subscriptionPlanInfo || null,
      },
      formattedProducts: formattedData.items || [],
    };
  }
  return null;
}

export function formatProductList(productList: any[]): any[] {
  if (!Array.isArray(productList) || productList.length === 0) {
    return [];
  }

  // Group products by dealId
  const groupedProducts = productList.reduce(
    (acc, product) => {
      const dealId = product.dealId;
      if (!acc[dealId]) {
        acc[dealId] = [];
      }
      acc[dealId].push(product);
      return acc;
    },
    {} as Record<string, any[]>
  );

  // Format the grouped products
  const formattedProducts = Object.values(groupedProducts).map((products) => {
    const productArray = products as any[];
    if (productArray.length === 1) {
      // Single product, no variations needed
      return productArray[0];
    } else {
      // Multiple products with same dealId, create variations
      const baseProduct = { ...productArray[0] };
      baseProduct.variations = productArray
        .slice(1)
        .map((variation: any) => variation);

      return baseProduct;
    }
  });

  return formattedProducts;
}
