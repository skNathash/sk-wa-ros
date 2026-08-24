import { startOfMonth } from "date-fns";
import AccountService from "~/services/AccountService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

/**
 * Data helpers for the vendor overview summary cards. Mirrors the
 * buy-from-other-retailer retailer summary (same accounts + paylater APIs),
 * with order stats sourced from the purchase-order list API instead of OMS.
 */

// Outstanding payable amount owed to this vendor, via the same accounts API
// the payables page uses, filtered to the party.
export const fetchPayableAmount = async (vendorId: string) => {
  try {
    const response = await AccountService.getPayablesReceiveables({
      type: "payables",
      partyId: vendorId,
    });
    const value = (response?.data?.data || []).reduce(
      (acc: number, curr: any) => acc + Number(curr?.outstandingAmount || 0),
      0,
    );
    return Number(value) || 0;
  } catch (err) {
    return 0;
  }
};

// POs still to be inwarded (approved / partially received), matching the
// "Not Received" + "Partially Received" statuses of the PO list page.
const PENDING_INWARD_STATUSES = ["Approved", "Partially Received"];

export type PoStats = {
  count: number;
  value: number;
  pendingInward: number;
};

// This month's POs raised on this vendor, via the same purchase-order list
// API the vendor PO tab uses (filter "vendorInfo.id"). Value is summed from
// the listed orders' payableAmount.
export const fetchPoStats = async (vendorId: string): Promise<PoStats> => {
  try {
    const baseFilter: Record<string, any> = {
      "vendorInfo.id": vendorId,
      createdAt: { $gte: startOfMonth(new Date()).toISOString() },
    };

    const [countResp, listResp, pendingResp] = await Promise.all([
      PurchaseOrderService.getCount({ filter: baseFilter }),
      PurchaseOrderService.getList({
        page: 1,
        count: 100,
        filter: baseFilter,
      }),
      PurchaseOrderService.getCount({
        filter: {
          ...baseFilter,
          status: { $in: PENDING_INWARD_STATUSES },
        },
      }),
    ]);

    const list = Array.isArray(listResp?.data?.data) ? listResp.data.data : [];
    const value = list.reduce(
      (acc: number, curr: any) => acc + Number(curr?.payableAmount || 0),
      0,
    );

    return {
      count: Number(countResp?.data?.count) || 0,
      value: Number(value) || 0,
      pendingInward: Number(pendingResp?.data?.count) || 0,
    };
  } catch (err) {
    return { count: 0, value: 0, pendingInward: 0 };
  }
};
