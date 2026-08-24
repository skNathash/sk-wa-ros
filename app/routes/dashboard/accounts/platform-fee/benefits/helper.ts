import {
  differenceInCalendarDays,
  endOfDay,
  startOfDay,
  subDays,
  subMonths,
} from "date-fns";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import SellerService from "~/services/SellerService";

export interface MonthlyBuySummary {
  /** Raw purchase value over the window, in rupees. */
  value: number;
  /** Compact display value, e.g. "₹8 L". */
  display: string;
  caption: string;
}

export interface CounterBillsSummary {
  /** Total POS bills over the window. */
  totalBills: number;
  perDay: number;
  perMonth: number;
  /** Display value for the card, e.g. "120". */
  display: string;
  caption: string;
}

export interface ShopShapeSummary {
  monthlyBuy: MonthlyBuySummary;
  counterBills: CounterBillsSummary;
}

/** Compact Indian currency — ₹8 L, ₹1.2 Cr, ₹50 K, ₹8,500. */
export const formatCompactAmount = (amount: number): string => {
  const n = Math.abs(Number(amount) || 0);

  if (n >= 10000000) {
    return `₹${trimDecimal(n / 10000000)} Cr`;
  }

  if (n >= 100000) {
    return `₹${trimDecimal(n / 100000)} L`;
  }

  if (n >= 1000) {
    return `₹${trimDecimal(n / 1000)} K`;
  }

  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

const trimDecimal = (n: number) => {
  const rounded = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
  return rounded.toLocaleString("en-IN");
};

/** Last 30 completed days — the window the "last month" copy refers to. */
const getMonthlyBuyRange = () => {
  const now = new Date();
  return {
    startDate: startOfDay(subDays(now, 30)).toISOString(),
    endDate: endOfDay(subDays(now, 1)).toISOString(),
  };
};

/** Last 12 months, so the per-day average is not skewed by a quiet week. */
const getCounterBillsRange = () => {
  const now = new Date();
  return {
    start: startOfDay(subMonths(now, 12)),
    end: endOfDay(now),
  };
};

/**
 * Total purchase value raised against vendors over the last 30 days.
 * Endpoint: GET purchase/orders/{fid}/summary?outputType=count
 */
export const getMonthlyBuy = async (): Promise<MonthlyBuySummary> => {
  const fallback: MonthlyBuySummary = {
    value: 0,
    display: "—",
    caption: "from vendors last month · adjust below to re-match",
  };

  try {
    const response = await PurchaseOrderService.getPoDashboardSummary(
      AuthService.getLoggedInUserId() || "",
      { outputType: "count", ...getMonthlyBuyRange() },
    );

    const summary = response?.data?.data?.overallSummary || {};
    const value = Number(summary.totalPOValue) || 0;

    return {
      value,
      display: formatCompactAmount(value),
      caption: "from vendors last month · adjust below to re-match",
    };
  } catch (e) {
    return fallback;
  }
};

/**
 * POS bills billed at the counter, averaged per day over the last 12 months.
 * Endpoint: GET sales/order/{fid}/list?outputType=count
 */
export const getCounterBills = async (): Promise<CounterBillsSummary> => {
  const fallback: CounterBillsSummary = {
    totalBills: 0,
    perDay: 0,
    perMonth: 0,
    display: "—",
    caption: "bills at your counter · at your pace",
  };

  try {
    const { start, end } = getCounterBillsRange();

    const response = await SellerService.getSellerOrders(
      AuthService.getLoggedInUserId() || "",
      {
        outputType: "count",
        filter: {
          // orderType: "B2C",
          // orderSubType: "POS",
          orderedDate: {
            $gte: start.toISOString(),
            $lte: end.toISOString(),
          },
        },
      },
    );

    const totalBills = Number(response?.data?.data) || 0;
    const days = Math.max(differenceInCalendarDays(end, start), 1);
    const perDay = Math.round(totalBills / days);
    const perMonth = perDay * 30;

    return {
      totalBills,
      perDay,
      perMonth,
      display: perDay.toLocaleString("en-IN"),
      caption: `${perMonth.toLocaleString("en-IN")} bills / month · at your pace`,
    };
  } catch (e) {
    return fallback;
  }
};

/** Both hero numbers in one call, fetched in parallel. */
export const getShopShape = async (): Promise<ShopShapeSummary> => {
  const [monthlyBuy, counterBills] = await Promise.all([
    getMonthlyBuy(),
    getCounterBills(),
  ]);

  return { monthlyBuy, counterBills };
};
