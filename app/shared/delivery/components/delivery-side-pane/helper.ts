import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import SellerService from "~/services/SellerService";

/** Open work behind each delivery view, keyed the same way as its tab/chip. */
export interface DeliveryStageCounts {
  dispatch?: number;
  "in-transit"?: number;
  "cod-reconciliation"?: number;
}

/** Statuses each delivery view works on — the same ones its page filters on. */
export const DISPATCH_STATUSES = ["Invoiced", "Pending Shipment"];
export const IN_TRANSIT_STATUS = "Shipped";
export const DELIVERED_STATUS = "Delivered";

const getOrderCount = async (status: string | string[]) => {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    {
      filter: {
        status: Array.isArray(status) ? { $in: status } : status,
      },
      outputType: "count",
    },
  );
  return response?.data?.data || 0;
};

/** Cash a rider is still holding — the "Pending" tab of the reconciliation page. */
export interface PendingHandover {
  /** Settlements still open. */
  count: number;
  /** Rupees behind those settlements. */
  amount: number;
}

/**
 * COD still to be handed over. Same filter the reconciliation page runs for its
 * "Pending Handover" summary tile, so the pane and that page agree.
 */
export const getPendingHandover = async (): Promise<PendingHandover> => {
  const response = await SellerService.getSettlements({
    filter: { status: "SettlementInitiated" },
    outputType: "count",
  });
  const data = response?.data?.data;

  if (typeof data === "number") return { count: data, amount: 0 };

  return { count: data?.count || 0, amount: data?.totalAmount || 0 };
};

const getPendingSettlementCount = async () =>
  (await getPendingHandover()).count;

/**
 * The newest few orders in one of the pane's recent lists. Both lists run the
 * In Transit tab's call (`getSalesOrders`), only the status differs: the first
 * shows what has gone out ("Shipped"), the second what has landed
 * ("Delivered"). Trimmed to what fits a side pane.
 */
export const getRecentDeliveryOrders = async (
  type: "dispatch" | "in-transit",
  limit = 5,
) => {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    {
      page: 1,
      limit,
      filter: {
        status: type === "dispatch" ? IN_TRANSIT_STATUS : DELIVERED_STATUS,
      },
    },
  );
  return OmsService.formatOrderResponse(response?.data?.data || []);
};

/** Counts for the whole pane, resolved in one go. A failing call reads as 0. */
export const getDeliveryStageCounts =
  async (): Promise<DeliveryStageCounts> => {
    const settle = (value: PromiseSettledResult<number>) =>
      value.status === "fulfilled" ? value.value : 0;

    const [dispatch, inTransit, cod] = await Promise.allSettled([
      getOrderCount(DISPATCH_STATUSES),
      getOrderCount(IN_TRANSIT_STATUS),
      getPendingSettlementCount(),
    ]);

    return {
      dispatch: settle(dispatch),
      "in-transit": settle(inTransit),
      "cod-reconciliation": settle(cod),
  };
};

