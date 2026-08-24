import { subMonths } from "date-fns";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";

// Outstanding payable amount owed to this retailer, via the same
// accounts API the payables page uses, filtered to the party.
export const fetchPayableAmount = async (id: string) => {
  try {
    const response = await AccountService.getPayablesReceiveables({
      type: "payables",
      partyId: id,
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

// Orders placed by the logged-in user with this retailer over the last
// 6 months, via the same sales-order API the Orders tab uses. "Arriving"
// counts orders still in flight (not yet delivered/closed).
export const fetchOrderStats = async (retailerId: string) => {
  try {
    const baseParams: Record<string, any> = {
      outputType: "count",
      filter: {
        "customerInfo.customerId": AuthService.getLoggedInUserId(),
        createdAt: { $gte: subMonths(new Date(), 6).toISOString() },
      },
    };

    const [totalResp, arrivingResp] = await Promise.all([
      OmsService.getSalesOrders(retailerId, baseParams),
      OmsService.getSalesOrders(retailerId, {
        ...baseParams,
        filter: {
          ...baseParams.filter,
          status: { $in: ["Created", "Pending", "Shipped"] },
        },
      }),
    ]);

    return {
      total: Number(totalResp?.data?.data) || 0,
      arriving: Number(arrivingResp?.data?.data) || 0,
    };
  } catch (err) {
    return { total: 0, arriving: 0 };
  }
};
