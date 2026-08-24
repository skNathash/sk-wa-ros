import { endOfDay, format, startOfDay, subDays } from "date-fns";
import AuthService from "~/services/AuthService";
import LogisticsService from "~/services/LogisticsService";
import OmsService from "~/services/OmsService";

/** Orders still being made up in the pack area. */
export const PACKING_STATUS = "Packing";

/** One side-pane row per delivery status shown in the screenshot UI. */
export interface DeliveryStatusCount {
  /** Stable key for selection and routing. */
  key: string;
  /** Uppercase badge label above the title. */
  badge: string;
  /** Primary card title. */
  title: string;
  /** Short hint shown under the title. */
  hint: string;
  /** Live count displayed on the right. Undefined until it loads. */
  count?: number;
  /** Tailwind colour tokens for the badge and active tile state. */
  theme: {
    badgeText: string;
    badgeBg: string;
    activeTile: string;
    activeTileBorder: string;
    countText: string;
  };
}

/** The stage rows of the delivery side pane, in the order they are shown. */
export const DELIVERY_STATUS_CARDS: DeliveryStatusCount[] = [
  {
    key: "packing",
    badge: "Packing",
    title: "Packing",
    hint: "in pack area",
    theme: {
      badgeText: "tw:text-emerald-700",
      badgeBg: "tw:bg-emerald-100",
      activeTile: "tw:bg-emerald-50",
      activeTileBorder: "tw:border-emerald-200",
      countText: "tw:text-emerald-700",
    },
  },
  {
    key: "ready",
    badge: "Ready",
    title: "Ready",
    hint: "waiting for runner",
    theme: {
      badgeText: "tw:text-green-700",
      badgeBg: "tw:bg-green-100",
      activeTile: "tw:bg-green-50",
      activeTileBorder: "tw:border-green-200",
      countText: "tw:text-green-700",
    },
  },
  {
    key: "handoff",
    badge: "Handoff",
    title: "Hand-off",
    hint: "OTP in progress",
    theme: {
      badgeText: "tw:text-rose-700",
      badgeBg: "tw:bg-rose-100",
      activeTile: "tw:bg-rose-50",
      activeTileBorder: "tw:border-rose-200",
      countText: "tw:text-rose-700",
    },
  },
  {
    key: "on-route",
    badge: "On Route",
    title: "On route",
    hint: "live tracking",
    theme: {
      badgeText: "tw:text-blue-700",
      badgeBg: "tw:bg-blue-100",
      activeTile: "tw:bg-blue-50",
      activeTileBorder: "tw:border-blue-200",
      countText: "tw:text-blue-700",
    },
  },
  {
    key: "delivered",
    badge: "Delivered",
    title: "Delivered",
    hint: "completed in range",
    theme: {
      badgeText: "tw:text-green-700",
      badgeBg: "tw:bg-green-100",
      activeTile: "tw:bg-green-50",
      activeTileBorder: "tw:border-green-200",
      countText: "tw:text-green-700",
    },
  },
  {
    key: "return",
    badge: "Return",
    title: "Returns",
    hint: "coming back",
    theme: {
      badgeText: "tw:text-violet-700",
      badgeBg: "tw:bg-violet-100",
      activeTile: "tw:bg-violet-50",
      activeTileBorder: "tw:border-violet-200",
      countText: "tw:text-violet-700",
    },
  },
];

/** Live count per status card, keyed like `DELIVERY_STATUS_CARDS`. */
export interface DeliveryStatusCounts {
  packing?: number;
  ready?: number;
  handoff?: number;
  "on-route"?: number;
  delivered?: number;
}

/** API wants plain local timestamps — no zone suffix. */
const toApiDate = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm:ss");

/** Days the pane looks back over when no range is passed in. */
export const DEFAULT_RANGE_DAYS = 30;

/** The default window: the last 30 days, today included. */
export const getDefaultDateRange = () => {
  const to = new Date();
  return { from: subDays(to, DEFAULT_RANGE_DAYS - 1), to };
};

/** How many orders sit on a status — the count the pack area works off. */
const getOrderCount = async (status: string) => {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    {
      filter: { status },
      outputType: "count",
    },
  );
  return response?.data?.data || 0;
};

/**
 * The dispatch summary over a date range: how many shipments are waiting to be
 * handed over, sitting with a runner, on the road and closed. Same call the
 * dispatch summary strip runs, so the pane and that page agree.
 */
const getShipmentSummary = async (from: Date, to: Date) => {
  const response = await LogisticsService.fetchShipments({
    outputType: "summary",
    filter: {
      franchiseId: AuthService.getLoggedInUserId() || "",
      deliveredFrom: toApiDate(startOfDay(from)),
      deliveredTo: toApiDate(endOfDay(to)),
    },
  });
  return response?.data?.data;
};

/**
 * Counts for the pane's status cards. Packing is an order-status count — the
 * pack area works off orders, not shipments — the rest come from the dispatch
 * summary, over the last 30 days unless a range is passed in. Returns are not
 * counted here. A failing call leaves its cards blank rather than showing a
 * wrong number.
 */
export const getDeliveryStatusCounts = async (
  { from, to }: { from: Date; to: Date } = getDefaultDateRange(),
): Promise<DeliveryStatusCounts> => {
  const [packing, summary] = await Promise.allSettled([
    getOrderCount(PACKING_STATUS),
    getShipmentSummary(from, to),
  ]);

  const range = summary.status === "fulfilled" ? summary.value : undefined;

  return {
    packing: packing.status === "fulfilled" ? packing.value : undefined,
    ready: range?.ready,
    handoff: range?.handoff,
    "on-route": range?.onRoute,
    delivered: range?.delivered,
  };
};
