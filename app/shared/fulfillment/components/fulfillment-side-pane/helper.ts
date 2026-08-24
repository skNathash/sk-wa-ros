import { startOfDay, subDays } from "date-fns";
import AuthService from "~/services/AuthService";
import SellerService from "~/services/SellerService";

/** Tint applied to a stage row in the pane, its board lane and card bar. */
export type FulfillmentStageTone =
  | "sky"
  | "violet"
  | "amber"
  | "blue"
  | "teal"
  | "green";

/**
 * One step of the fulfilment pipeline. `status` is the set of order statuses
 * behind the step — the same value the list page hands to its order card and
 * to the counts API, so the pane and the page can never drift apart.
 */
export interface FulfillmentStage {
  /** Stage key — also the key used in the counts map and the `tab` param. */
  key: string;
  /** Full label used by the board lane heading. */
  label: string;
  /** Short pane label (e.g. "PICK"). */
  paneLabel: string;
  /** One-line hint under the pane label (e.g. "collect items"). */
  hint: string;
  /** Order statuses behind this stage. */
  status: string | string[];
  tone: FulfillmentStageTone;
  /** True while the order is still moving through the store. */
  live?: boolean;
}

export const FULFILLMENT_STAGES: FulfillmentStage[] = [
  {
    key: "approval-pending",
    label: "New Orders",
    paneLabel: "NEW",
    hint: "accept order",
    status: ["Created", "Pending"],
    tone: "sky",
    live: true,
  },
  {
    key: "picked",
    label: "Picking Orders",
    paneLabel: "PICK",
    hint: "collect items",
    status: ["Picked", "Picking"],
    tone: "violet",
    live: true,
  },
  {
    key: "packing-invoiced",
    label: "Packing Orders",
    paneLabel: "PACK",
    hint: "pack in bag",
    status: ["Packing", "Packed"],
    tone: "amber",
    live: true,
  },
  {
    key: "pending-shipment",
    label: "Awaiting Shipment",
    paneLabel: "SHIP",
    hint: "ready to send",
    status: ["Pending Shipment", "Invoiced"],
    tone: "blue",
    live: true,
  },
  {
    key: "shipped",
    label: "Shipped Orders",
    paneLabel: "SHIPPED",
    hint: "on the way",
    status: "Shipped",
    tone: "teal",
  },
  {
    key: "delivered",
    label: "Delivered Orders",
    paneLabel: "DELIVERED",
    hint: "order done",
    status: "Delivered",
    tone: "green",
  },
];

/** `{ statusKey: statuses }` shape the counts API expects. */
export const FULFILLMENT_STATUS_MAP: Record<string, string | string[]> =
  Object.fromEntries(
    FULFILLMENT_STAGES.map((stage) => [stage.key, stage.status]),
  );

export const FULFILLMENT_STAGE_TONES: Record<
  FulfillmentStageTone,
  { row: string; label: string; count: string; bar: string }
> = {
  sky: {
    row: "tw:bg-sky-50 tw:hover:bg-sky-100",
    label: "tw:text-sky-700",
    count: "tw:text-sky-600",
    bar: "tw:bg-sky-500",
  },
  violet: {
    row: "tw:bg-violet-50 tw:hover:bg-violet-100",
    label: "tw:text-violet-700",
    count: "tw:text-violet-600",
    bar: "tw:bg-violet-500",
  },
  amber: {
    row: "tw:bg-amber-50 tw:hover:bg-amber-100",
    label: "tw:text-amber-700",
    count: "tw:text-amber-600",
    bar: "tw:bg-amber-500",
  },
  blue: {
    row: "tw:bg-blue-50 tw:hover:bg-blue-100",
    label: "tw:text-blue-700",
    count: "tw:text-blue-600",
    bar: "tw:bg-blue-500",
  },
  teal: {
    row: "tw:bg-teal-50 tw:hover:bg-teal-100",
    label: "tw:text-teal-700",
    count: "tw:text-teal-600",
    bar: "tw:bg-teal-500",
  },
  green: {
    row: "tw:bg-emerald-50 tw:hover:bg-emerald-100",
    label: "tw:text-emerald-700",
    count: "tw:text-emerald-600",
    bar: "tw:bg-emerald-500",
  },
};

/** How far down the pipeline a stage sits, 0 → 1 — drives the card bar. */
export const getStageProgress = (key: string) => {
  const index = FULFILLMENT_STAGES.findIndex((stage) => stage.key === key);
  if (index < 0) return 0;
  return (index + 1) / FULFILLMENT_STAGES.length;
};

/** Counts keyed by stage key, as returned by `getCountsForStatusMap`. */
export type FulfillmentStageCounts = Record<string, number>;

/** Where a stage row lands when the pane has no page of its own to drive. */
export const FULFILLMENT_LIST_URL = "/dashboard/fulfillment/list";

/**
 * How many orders sit in each stage right now. The board page resolves these
 * alongside its lanes and hands them to the pane; pages with no board of their
 * own let the pane call this itself.
 */
export const getFulfillmentStageCounts =
  async (): Promise<FulfillmentStageCounts> => {
    const fid = AuthService.getLoggedInUserId() || "";

    const results = await Promise.all(
      FULFILLMENT_STAGES.map(async (stage) => {
        const filter: Record<string, any> = {
          status: {
            $in: Array.isArray(stage.status) ? stage.status : [stage.status],
          },
        };
        // The delivered lane only ever covers the last 30 days — same window
        // the board lists, so the pane count matches what a tap opens.
        if (stage.key === "delivered") {
          filter.orderedDate = { $gte: startOfDay(subDays(new Date(), 30)) };
        }

        const response = await SellerService.getSellerOrders(fid, {
          filter,
          outputType: "count",
        });
        return [stage.key, response?.data?.data || 0] as const;
      }),
    );

    return Object.fromEntries(results);
  };

/**
 * Which chip set the pane shows — the board's order-type filter, or the order
 * channels the list page navigates between.
 */
export type FulfillmentChipType = "order-type" | "order-channel";

/** Order-type filter behind the pane chips — matches the `type` search param. */
export type FulfillmentTypeKey = "all" | "B2B" | "B2C";

export type FulfillmentTypeCounts = Partial<
  Record<FulfillmentTypeKey, number>
>;

/** Orders still in the store (everything before Shipped). */
export const getLiveOrderCount = (counts?: FulfillmentStageCounts) =>
  FULFILLMENT_STAGES.filter((stage) => stage.live).reduce(
    (total, stage) => total + (counts?.[stage.key] || 0),
    0,
  );

/** Every order the stages cover, closed ones included. */
export const getTotalOrderCount = (counts?: FulfillmentStageCounts) =>
  FULFILLMENT_STAGES.reduce(
    (total, stage) => total + (counts?.[stage.key] || 0),
    0,
  );

/** Pane header scope label — "6 live · 22 orders". */
export const formatFulfillmentSummary = (counts?: FulfillmentStageCounts) => {
  if (!counts) return "";
  const total = getTotalOrderCount(counts);
  if (!total) return "";
  return `${getLiveOrderCount(counts)} live · ${total} orders`;
};
