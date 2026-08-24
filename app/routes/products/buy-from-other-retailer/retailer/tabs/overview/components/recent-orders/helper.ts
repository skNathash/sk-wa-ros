import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";

/** How many orders the overview recap shows. */
export const RECENT_ORDERS_LIMIT = 5;

// Orders here are the ones exchanged between the logged-in user and the
// retailer being viewed — either side can be the seller.
const partyFilter = (): Record<string, any> => ({
  $or: [
    { "customerInfo.customerId": AuthService.getLoggedInUserId() },
    { "sellerInfo.franchiseId": AuthService.getLoggedInUserId() },
  ],
});

/**
 * Latest orders exchanged with this retailer — same API and formatting the
 * Orders tab uses, only capped to the newest few and with no filters applied.
 */
export const getData = async (retailerId: string) => {
  try {
    const params = {
      page: 1,
      count: RECENT_ORDERS_LIMIT,
      filter: partyFilter(),
      sort: { createdAt: -1 },
    };

    const response = await OmsService.getSalesOrders(retailerId, params);
    const orders = Array.isArray(response?.data?.data) ? response.data.data : [];

    return OmsService.formatOrderResponse(orders).slice(0, RECENT_ORDERS_LIMIT);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }
};

// Convenience accessors so both views read the same shape, regardless of which
// field the payload populated.
export const getOrderTotal = (order: any) =>
  Number(order?.totalAmount ?? order?.orderAmount ?? 0);

export const getOrderItemsCount = (order: any) =>
  order?.items?.length || order?.itemsCount || 0;

type StatusTone = { icon: string; badge: string };

/**
 * Tone for the row's leading tile and status pill, keyed off the badge variant
 * `formatOrderResponse` already resolves (`_statusColor`).
 */
export const getStatusTone = (order: any): StatusTone => {
  switch (order?._statusColor) {
    case "success":
      return {
        icon: "tw:bg-emerald-50 tw:text-emerald-600",
        badge: "tw:bg-emerald-50 tw:text-emerald-700",
      };
    case "warning":
      return {
        icon: "tw:bg-amber-50 tw:text-amber-600",
        badge: "tw:bg-amber-50 tw:text-amber-700",
      };
    case "danger":
      return {
        icon: "tw:bg-rose-50 tw:text-rose-500",
        badge: "tw:bg-rose-50 tw:text-rose-600",
      };
    case "primary":
      return {
        icon: "tw:bg-sky-50 tw:text-sky-600",
        badge: "tw:bg-sky-50 tw:text-sky-700",
      };
    default:
      return {
        icon: "tw:bg-slate-100 tw:text-slate-500",
        badge: "tw:bg-slate-100 tw:text-slate-600",
      };
  }
};
