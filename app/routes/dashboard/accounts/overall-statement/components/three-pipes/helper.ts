import AccountService from "~/services/AccountService";
import type { AccountsDateRange } from "~/shared/accounts/hooks/useAccountsDateRange";

export type PipeLane = {
  key: string;
  label: string;
  amount: number;
  /** Supporting line — order count and average ticket, already formatted. */
  note: string;
};

export type ThreePipesData = {
  lanes: PipeLane[];
};

export const emptyThreePipes = (): ThreePipesData => ({ lanes: [] });

const ordersNote = (orders: number, avgOrderValue: number) =>
  `${orders} ${orders === 1 ? "order" : "orders"} · avg ₹${Math.round(
    avgOrderValue
  ).toLocaleString("en-IN")}`;

export const getThreePipes = async (
  range: AccountsDateRange
): Promise<ThreePipesData> => {
  const response = await AccountService.getDashboardOverview({
    type: "customerType",
    ...range,
  });
  const lanes = response?.data?.data;

  if (!lanes) return emptyThreePipes();

  return {
    lanes: Object.entries(lanes).map(([key, lane]: [string, any]) => ({
      key,
      label: lane.label,
      amount: lane.amount,
      note: ordersNote(lane.orders, lane.avgOrderValue),
    })),
  };
};
