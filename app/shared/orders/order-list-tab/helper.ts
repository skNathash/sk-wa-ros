import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import LogisticsService from "~/services/LogisticsService";

/**
 * Helper functions to fetch order counts for order-list tabs.
 * Each function returns a number (count). Callers should handle errors.
 */

export const getReceiveOrderCount = async (): Promise<number> => {
  try {
    const resp = await LogisticsService.getBoxes(
      AuthService.getLoggedInUserId(),
      {
        filter: {
          status: { $in: ["Shipped", "Delivered"] },
        },
        outputType: "count",
      },
    );
    return resp?.data?.data || 0;
  } catch (e) {
    console.error("Error fetching receive order count:", e);
    return 0;
  }
};

export const getB2COrderCount = async (): Promise<number> => {
  try {
    const countParams = {
      filter: { orderType: "B2C", status: { $in: ["Created", "Pending"] } },
      outputType: "count",
    };
    const resp = await OmsService.getSalesOrders(
      AuthService.getLoggedInUserId() || "",
      countParams,
    );
    // API may return number directly or nested; keep defensive checks
    return resp?.data?.data || 0;
  } catch (e) {
    console.error("Error fetching B2C order count:", e);
    return 0;
  }
};

export const getB2BOrderCount = async (): Promise<number> => {
  try {
    const countParams = {
      filter: { orderType: "B2B", status: { $in: ["Created", "Pending"] } },
      outputType: "count",
    };
    const resp = await OmsService.getSalesOrders(
      AuthService.getLoggedInUserId() || "",
      countParams,
    );
    return resp?.data?.data || 0;
  } catch (e) {
    console.error("Error fetching B2B order count:", e);
    return 0;
  }
};

export const getCoinStoreOrderCount = async (): Promise<number> => {
  try {
    const countParams = {
      filter: { orderSubType: "COINSTORE", status: { $in: ["Created"] } },
      outputType: "count",
    };
    const resp = await OmsService.getSalesOrders(
      AuthService.getLoggedInUserId() || "",
      countParams,
    );
    return resp?.data?.data || 0;
  } catch (e) {
    console.error("Error fetching CoinStore order count:", e);
    return 0;
  }
};

export const getUnconfirmedOrderCount = async (): Promise<number> => {
  try {
    const countParams = {
      filter: { status: "Pending", isReserveOrder: true },
      outputType: "count",
    };
    const resp = await OmsService.getSalesOrders(
      AuthService.getLoggedInUserId() || "",
      countParams,
    );
    return resp?.data?.data || 0;
  } catch (e) {
    console.error("Error fetching unconfirmed order count:", e);
    return 0;
  }
};

export const getPaymentApprovalCount = async (): Promise<number> => {
  try {
    const countParams = {
      filter: { "paymentMode.approvalStatus": "Pending" },
      outputType: "count",
    };
    const resp = await OmsService.getSalesOrders(
      AuthService.getLoggedInUserId() || "",
      countParams,
    );
    return resp?.data?.data || 0;
  } catch (e) {
    console.error("Error fetching Payment Approval order count:", e);
    return 0;
  }
};

export const getOrderRequestsCount = async (): Promise<number> => {
  try {
    const countParams = {
      filter: { status: { $in: ["Pending", "Open"] } },
      outputType: "count",
    };
    const resp = await OmsService.getSplitRequestCustomerList(countParams);
    return resp?.data?.data?.count || 0;
  } catch (e) {
    console.error("Error fetching Order Requests count:", e);
    return 0;
  }
};
