import { format } from "date-fns";
import AccountService from "~/services/AccountService";
import type { AccountsDateRange } from "~/shared/accounts/hooks/useAccountsDateRange";

/** Lane name as the API prints it — "B2C", "B2B". */
export type LaneKey = string;

export type LaneMode = {
  key: string;
  /** Payment method label — Cash, UPI, Bank. */
  label: string;
  amount: number;
};

export type CollectionLane = {
  key: LaneKey;
  /** Card title, e.g. "B2C · from customers". */
  label: string;
  /** Window the card is read over, printed on the right of the title. */
  periodLabel: string;
  amount: number;
  /** Order count / average ticket line under the number. */
  meta: string;
  /** Method-wise split of `amount`, left to right. */
  modes: LaneMode[];
  /** Title + selected-border tone for the lane. */
  accent: string;
};

export type CollectionLanesData = {
  lanes: CollectionLane[];
};

export const emptyCollectionLanes = (): CollectionLanesData => ({ lanes: [] });

export const defaultLane: LaneKey = "B2C";

/* Both lanes are always on the page, in this order — a lane the API leaves out
   simply collected nothing in the window and reads as a zero card. */
const laneOrder: LaneKey[] = ["B2C", "B2B"];

/** Who the money came from, per lane — the second half of the card title. */
const laneSource: Record<string, string> = {
  B2C: "from customers",
  B2B: "from sellers",
};

const laneAccent: Record<string, string> = {
  B2C: "#1f8a4f",
  B2B: "#2563eb",
};

const methodLabel = (method: string) =>
  method.length > 3
    ? `${method.charAt(0).toUpperCase()}${method.slice(1)}`
    : method.toUpperCase();

export const getCollectionLanes = async (
  range: AccountsDateRange,
): Promise<CollectionLanesData> => {
  const response = await AccountService.getMoneyInDashboard({
    type: "by_lane",
    ...range,
  });
  const byLane = response?.data?.data?.by_lane;

  if (!byLane) return emptyCollectionLanes();

  const period = byLane.period;
  const periodLabel = `${format(new Date(period.startDate), "dd MMM")} – ${format(
    new Date(period.endDate),
    "dd MMM",
  )}`;

  return {
    lanes: laneOrder.map((key) => {
      const lane = byLane.lanes.find((item: any) => item.lane === key);

      if (!lane) {
        return {
          key,
          label: `${key} · ${laneSource[key]}`,
          periodLabel,
          amount: 0,
          meta: "0 orders",
          modes: [],
          accent: laneAccent[key],
        };
      }

      return {
        key,
        label: `${key} · ${laneSource[key]}`,
        periodLabel,
        amount: lane.totalAmount,
        meta: `${lane.orders} orders · avg ₹${lane.avgOrder}`,
        modes: lane.byPaymentMethod.map((method: any) => ({
          key: method.paymentMethod,
          label: methodLabel(method.paymentMethod),
          amount: method.amount,
        })),
        accent: laneAccent[key],
      };
    }),
  };
};
