import { format } from "date-fns";
import AccountService from "~/services/AccountService";

/** Decides the tile's number colour — plain count, money owed, or headroom. */
export type PaylaterStatTone = "count" | "outstanding" | "limit";

export type PaylaterStat = {
  key: string;
  /** Small caps label at the top of the tile. */
  label: string;
  /** Printed as-is for the customer count, as money for the two amounts. */
  value: number;
  isAmount: boolean;
  /** Supporting line under the number. */
  note: string;
  tone: PaylaterStatTone;
};

export type PaylaterStatsData = {
  items: PaylaterStat[];
};

export const emptyPaylaterStats = (): PaylaterStatsData => ({ items: [] });

/** Customers read alongside the summary, enough to spot the nearest cycle. */
const cycleLookAhead = 10;

/**
 * The soonest validity end date still ahead of us — printed under the drawn
 * balance as the date that money is next due back.
 */
const nextCycleLabel = (customers: any[]): string => {
  const today = new Date().setHours(0, 0, 0, 0);
  const upcoming = customers
    .map((customer) => new Date(customer?.validityEndDate).getTime())
    .filter((time) => !Number.isNaN(time) && time >= today)
    .sort((a, b) => a - b);

  if (!upcoming.length) return "still to collect";

  return `next cycle ${format(new Date(upcoming[0]), "dd MMM")}`;
};

/**
 * The credit book's totals ride on the customers payload, so the block reads
 * the first page and keeps the summary plus the nearest validity date.
 */
export const getPaylaterStats = async (
  lane: string,
): Promise<PaylaterStatsData> => {
  const response = await AccountService.getMoneyInDashboard({
    type: "paylater_customers",
    lane,
    page: 1,
    limit: cycleLookAhead,
  });
  const book = response?.data?.data?.paylater_customers;
  const summary = book?.summary;

  if (!summary) return emptyPaylaterStats();

  const outstanding = Number(summary.totalOutstanding) || 0;
  const totalLimit = Number(summary.totalLimit) || 0;
  const customers = Number(summary.customers) || 0;
  /* Utilisation is the one number the API leaves to the screen — how much of
     the sanctioned limit is actually drawn. */
  const utilisation = totalLimit
    ? Math.round((outstanding / totalLimit) * 100)
    : 0;

  return {
    items: [
      {
        key: "customers",
        label: "Paylater customers",
        value: customers,
        isAmount: false,
        note: "on your credit book",
        tone: "count",
      },
      {
        key: "outstanding",
        label: "Outstanding balance",
        value: outstanding,
        isAmount: true,
        note: nextCycleLabel(book?.customers || []),
        tone: "outstanding",
      },
      {
        key: "limit",
        label: "Combined limit",
        value: totalLimit,
        isAmount: true,
        note: `util. ${utilisation}%`,
        tone: "limit",
      },
    ],
  };
};
