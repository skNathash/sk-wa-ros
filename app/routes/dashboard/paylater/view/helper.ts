import { subMonths } from "date-fns";
import AuthService from "~/services/AuthService";
import OmsDashboardService from "~/services/OmsDashboardService";
import OmsService from "~/services/OmsService";
import PaylaterService from "~/services/PaylaterService";

export const getRequest = async (id: string) => {
  const res = await PaylaterService.getRequest(id);
  const data = res.data?.data || null;
  if (!data) {
    return null;
  }
  return PaylaterService.formatPaylaterRequest([data])[0] || null;
};

/** Orders that actually reached the buyer — the numerator of the fill rate. */
const FULFILLED_STATUSES = ["Delivered", "Completed", "Closed"];

/** How far back the scorecard looks. The endpoint defaults to the same window. */
const SCORECARD_MONTHS = 6;

/** Orders read to derive the rates the scorecard endpoint does not carry. */
const SCORECARD_SAMPLE = 200;

/**
 * The four numbers above the request — what this buyer has done with the
 * logged-in seller. Spend / orders / average come off the purchase scorecard;
 * the fill rate and the repayment rate are derived here because the endpoint
 * does not carry them.
 */
export interface BuyerScorecard {
  /** Money spent with this seller over the window. */
  spend: number;
  orders: number;
  avgOrderValue: number;
  units: number;
  months: number;
  /** Share of orders that reached the buyer. `null` when there is no history. */
  fillRate: number | null;
  /**
   * Share of this buyer's PayLater wallets that are not past their date, as a
   * stand-in for repayment behaviour — the wallet feed carries no per-bill
   * payment dates. `null` when the buyer holds no wallets.
   */
  onTimeRate: number | null;
  /** How many wallets that rate was read from. */
  walletCount: number;
}

export const EMPTY_SCORECARD: BuyerScorecard = {
  spend: 0,
  orders: 0,
  avgOrderValue: 0,
  units: 0,
  months: SCORECARD_MONTHS,
  fillRate: null,
  onTimeRate: null,
  walletCount: 0,
};

/**
 * Purchase scorecard for one buyer. The endpoint is keyed on the buyer id it
 * calls `franchiseId`; it answers for B2B buyers, so a B2C customer comes back
 * empty and the totals fall back to the order sample read alongside it.
 */
const getPurchaseScorecard = async (buyerId: string) => {
  try {
    const resp: any = await OmsDashboardService.getPurchaseScorecard({
      franchiseId: buyerId,
      months: SCORECARD_MONTHS,
    });
    const data = resp?.data?.data;
    if (!data) return null;

    return {
      spend: Number(data?.spend?.amount || 0),
      orders: Number(data?.spend?.orders || 0),
      units: Number(data?.spend?.units || 0),
      avgOrderValue: Number(
        data?.avgOrder?.amount ?? data?.spend?.avgOrderValue ?? 0,
      ),
      months: Number(data?.months || SCORECARD_MONTHS),
    };
  } catch (e) {
    return null;
  }
};

/**
 * A sample of the buyer's orders with this seller over the window — used for
 * the fill rate, and as the fallback totals when the scorecard is empty. The
 * page is capped, so a deep history is read as a floor, not an exact total.
 */
const getOrderSample = async (buyerId: string) => {
  const myId = AuthService.getLoggedInUserId() || "";
  if (!myId) return null;

  try {
    const resp: any = await OmsService.getSalesOrders(myId, {
      page: 1,
      count: SCORECARD_SAMPLE,
      filter: {
        "customerInfo.customerId": buyerId,
        createdAt: { $gte: subMonths(new Date(), SCORECARD_MONTHS) },
      },
    });

    const rows: any[] = Array.isArray(resp?.data?.data) ? resp.data.data : [];
    if (!rows.length) return null;

    const spend = rows.reduce(
      (sum, row) => sum + (Number(row?.orderAmount) || 0),
      0,
    );
    const fulfilled = rows.filter((row) =>
      FULFILLED_STATUSES.includes(row?.status),
    ).length;

    return {
      spend,
      orders: rows.length,
      units: rows.reduce((sum, row) => sum + (Number(row?.itemsCount) || 0), 0),
      avgOrderValue: Math.round(spend / rows.length),
      fillRate: Math.round((fulfilled / rows.length) * 100),
    };
  } catch (e) {
    return null;
  }
};

/**
 * How the buyer is running the PayLater wallets they already hold — the share
 * that is not past its date. Read across every seller, so it reflects the
 * buyer's behaviour rather than just this one relationship.
 */
const getRepaymentRate = async (buyerId: string) => {
  try {
    const resp: any = await PaylaterService.getRequests({
      page: 1,
      count: SCORECARD_SAMPLE,
      filter: {
        "userInfo.id": buyerId,
        status: { $in: ["Approved", "Paused"] },
      },
    });

    const rows = Array.isArray(resp?.data?.data) ? resp.data.data : [];
    const wallets = PaylaterService.formatPaylaterRequest(rows);
    if (!wallets.length) return { onTimeRate: null, walletCount: 0 };

    const onTime = wallets.filter((wallet: any) => !wallet.isOverdue).length;
    return {
      onTimeRate: Math.round((onTime / wallets.length) * 100),
      walletCount: wallets.length,
    };
  } catch (e) {
    return { onTimeRate: null, walletCount: 0 };
  }
};

/**
 * Everything the stat tiles show, in one call. The three sources are
 * independent, so one failing leaves the rest of the row populated.
 */
export const getBuyerScorecard = async (
  buyerId: string,
): Promise<BuyerScorecard> => {
  if (!buyerId) return EMPTY_SCORECARD;

  const [scorecard, sample, repayment] = await Promise.all([
    getPurchaseScorecard(buyerId),
    getOrderSample(buyerId),
    getRepaymentRate(buyerId),
  ]);

  return {
    spend: scorecard?.spend || sample?.spend || 0,
    orders: scorecard?.orders || sample?.orders || 0,
    units: scorecard?.units || sample?.units || 0,
    avgOrderValue: scorecard?.avgOrderValue || sample?.avgOrderValue || 0,
    months: scorecard?.months || SCORECARD_MONTHS,
    fillRate: sample?.fillRate ?? null,
    onTimeRate: repayment.onTimeRate,
    walletCount: repayment.walletCount,
  };
};

/**
 * The buyer's most recent PayLater orders from this seller's catalog. Same
 * `paymentMethod: PAYLATER` filter the PayLater orders page uses, narrowed to
 * one buyer — these are the orders the wallet under review actually funded.
 */
export const getPaylaterOrders = async (buyerId: string, limit = 5) => {
  const myId = AuthService.getLoggedInUserId() || "";
  if (!buyerId || !myId) return [];

  const resp: any = await OmsService.getSalesOrders(myId, {
    page: 1,
    count: limit,
    sort: { orderedDate: -1 },
    filter: {
      paymentMethod: "PAYLATER",
      "customerInfo.customerId": buyerId,
    },
  });

  const rows = Array.isArray(resp?.data?.data) ? resp.data.data : [];
  // The endpoint has been seen to ignore `count` on some filters, so the page
  // is trimmed here too.
  return OmsService.formatOrderResponse(rows.slice(0, limit));
};
