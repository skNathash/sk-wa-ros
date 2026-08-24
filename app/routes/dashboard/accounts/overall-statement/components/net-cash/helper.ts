import { format } from "date-fns";
import AccountService from "~/services/AccountService";
import type { AccountsDateRange } from "~/shared/accounts/hooks/useAccountsDateRange";

export type NetCashData = {
  periodLabel: string;
  net: number;
  received: number;
  paid: number;
  notes: number;
  /** "Books lock on 31 Aug", derived from the lock date. */
  lockLabel: string;
  /** Signed for display — debit balances read as negative. */
  walletBalance: number;
};

export const emptyNetCash = (): NetCashData => ({
  periodLabel: "",
  net: 0,
  received: 0,
  paid: 0,
  notes: 0,
  lockLabel: "",
  walletBalance: 0,
});

export const getNetCash = async (
  range: AccountsDateRange,
): Promise<NetCashData> => {
  const response = await AccountService.getDashboardOverview({
    type: "net_cash",
    ...range,
  });
  const overview = response?.data?.data;

  if (!overview) return emptyNetCash();

  return {
    periodLabel: overview.label,
    net: overview.netCash,
    received: overview.received,
    paid: overview.paid,
    notes: overview.notes,
    lockLabel: overview.booksLockOn
      ? `Books lock on ${format(new Date(overview.booksLockOn), "dd MMM")}`
      : "",
    walletBalance:
      overview.walletBalanceType === "debit"
        ? -overview.walletBalance
        : overview.walletBalance,
  };
};
