import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

export const getDetails = async (barcode: string) => {
  const res = await PurchaseOrderService.getPoPackages(
    AuthService.getLoggedInUserId(),
    {
      filter: {
        refNo: barcode,
      },
    }
  );
  return PurchaseOrderService.formatPoDashboardSummary(
    res.data?.data?.[0] || null
  );
};
