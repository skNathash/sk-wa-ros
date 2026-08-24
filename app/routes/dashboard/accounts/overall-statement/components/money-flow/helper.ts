import AccountService from "~/services/AccountService";
import type { AccountsDateRange } from "~/shared/accounts/hooks/useAccountsDateRange";

type LaneKey = "b2c" | "b2b" | "other";

type LaneResponse = {
  amount?: number;
  parties?: number;
};

export type MoneyFlowLane = {
  key: LaneKey;
  label: string;
  amount: number;
  parties: number;
  /** Width of this lane's bar segment, already formatted as a CSS percentage. */
  width: string;
  /** Opacity applied to the segment so lanes read apart within one tone. */
  opacity: number;
};

export type MoneyFlowCard = {
  key: "in" | "out";
  label: string;
  amount: number;
  /** Supporting party-count line under the amount, already formatted. */
  note: string;
  /** Non-zero lanes only — the split that makes up the headline amount. */
  lanes: MoneyFlowLane[];
};

export type MoneyFlowData = {
  cards: MoneyFlowCard[];
};

export const emptyMoneyFlow = (): MoneyFlowData => ({ cards: [] });

const laneLabels: Record<LaneKey, string> = {
  b2c: "B2C",
  b2b: "B2B",
  other: "Other",
};

const laneOrder: LaneKey[] = ["b2c", "b2b", "other"];

// Lanes share the card's tone and separate by weight instead of hue, so the
// pair of cards still reads as two colours overall.
const laneOpacity: Record<LaneKey, number> = {
  b2c: 1,
  b2b: 0.6,
  other: 0.35,
};

const partiesNote = (count: number) =>
  `${count} ${count === 1 ? "party" : "parties"}`;

const buildLanes = (
  byLane: Partial<Record<LaneKey, LaneResponse>> | undefined,
  total: number
): MoneyFlowLane[] =>
  laneOrder
    .map((key) => {
      const amount = byLane?.[key]?.amount ?? 0;
      return {
        key,
        label: laneLabels[key],
        amount,
        parties: byLane?.[key]?.parties ?? 0,
        width: total > 0 ? `${(amount / total) * 100}%` : "0%",
        opacity: laneOpacity[key],
      };
    })
    .filter((lane) => lane.amount > 0);

export const getMoneyFlow = async (
  range: AccountsDateRange
): Promise<MoneyFlowData> => {
  const response = await AccountService.getDashboardOverview({
    type: "summary",
    ...range,
  });
  const summary = response?.data?.data;

  if (!summary) return emptyMoneyFlow();

  const moneyComingIn = summary.moneyComingIn ?? 0;
  const moneyGoingOut = summary.moneyGoingOut ?? 0;

  return {
    cards: [
      {
        key: "in",
        label: "Money coming in",
        amount: moneyComingIn,
        note: partiesNote(summary.moneyComingInParties ?? 0),
        lanes: buildLanes(summary.moneyComingInByLane, moneyComingIn),
      },
      {
        key: "out",
        label: "Money going out",
        amount: moneyGoingOut,
        note: partiesNote(summary.moneyGoingOutParties ?? 0),
        lanes: buildLanes(summary.moneyGoingOutByLane, moneyGoingOut),
      },
    ],
  };
};
