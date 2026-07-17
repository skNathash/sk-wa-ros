import OmsService from "~/services/OmsService";
import LogisticsService from "~/services/LogisticsService";
import AuthService from "~/services/AuthService";

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

const getInvoiceDetails = async (invoiceId: string) => {
  const invResp = await OmsService.getSellerOrderInvoiceDetail(invoiceId);
  const data = invResp?.data?.data || {};
  return data;
};

export const getInvoices = async (invoices: string[]) => {
  const promises: any[] = [];
  invoices.forEach((invoice: string) => {
    promises.push(getInvoiceDetails(invoice));
  });
  const invResp = await Promise.all(promises);
  return invResp;
};

export const attachInvoiceDetails = (products: any[], invoices: any[]) => {
  products.forEach((product) => {
    let receivedQty = 0;
    invoices.forEach((invoice) => {
      const invProduct = invoice?.products?.find(
        (p: any) => p?.deal?.id === product?.dealId
      );
      if (invProduct) {
        receivedQty += invProduct?.qty || 0;
      }
    });
    product.receivedQty = receivedQty;
  });
  return products;
};

export const bulkReceiveBoxes = async (
  packages: any[],
  franchiseId?: string,
  onProgress?: (payload: {
    index: number;
    total: number;
    packageId?: string;
    success?: boolean;
    error?: any;
  }) => void
) => {
  const total = packages.length;
  const results: { packageId?: string; success: boolean; error?: any }[] = [];

  // default franchise id if not provided
  const franchise = franchiseId || AuthService.getLoggedInUserId();

  for (let i = 0; i < total; i++) {
    const pkg = packages[i];
    const packageId = pkg?._id || pkg?.packageId;

    // build items payload similar to BoxReceiveModal.receiveBox
    const items: any[] = [];
    (pkg?.items || []).forEach((e: any) => {
      (e.snapshots || []).forEach((s: any) => {
        items.push({
          id: s.id,
          dealId: e.dealId,
          quantity: s.quantity,
          remarks: "",
          location: "L1-R1-B1",
        });
      });
    });

    try {
      const res = await LogisticsService.receiveBox(packageId, {
        franchiseId: franchise,
        items,
      });

      const success = res?.statusCode === 200 || (res as any)?.status === 200;
      results.push({ packageId, success });
      if (onProgress) {
        onProgress({
          index: i + 1,
          total,
          packageId,
          success,
          error: undefined,
        });
      }
    } catch (error) {
      results.push({ packageId, success: false, error });
      if (onProgress) {
        onProgress({ index: i + 1, total, packageId, success: false, error });
      }
    }
  }

  return results;
};
