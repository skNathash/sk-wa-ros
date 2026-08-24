import { format } from "date-fns";
import AccountService from "~/services/AccountService";
import type { AccountsDateRange } from "~/shared/accounts/hooks/useAccountsDateRange";

/** Decides the tile's number colour — money in, waiting, or late. */
export type CollectionStatTone = "in" | "waiting" | "overdue";

export type CollectionStat = {
  key: string;
  /** Small caps label at the top of the tile. */
  label: string;
  amount: number;
  /** Supporting line under the number. */
  note: string;
  tone: CollectionStatTone;
  /** Part of `note` printed in the tile's ink, e.g. the top overdue party. */
  noteHighlight?: string;
};

export type CollectionStatsData = {
  items: CollectionStat[];
};

export const emptyCollectionStats = (): CollectionStatsData => ({ items: [] });

const dayLabel = (value: string) => format(new Date(value), "dd MMM");

export const getCollectionStats = async (
  range: AccountsDateRange,
  lane = "all",
): Promise<CollectionStatsData> => {
  const response = await AccountService.getMoneyInDashboard({
    type: "summary",
    filter: { lane },
    ...range,
  });
  const summary = response?.data?.data?.summary;

  if (!summary) return emptyCollectionStats();

  const waiting = summary.waitingToCollect;
  const overdue = summary.overdue;
  /* The tile names the window it was read for — the header's picker, echoed
     back by the API when it sends the period it settled on. */
  const period = summary.period ?? {};
  const startDate = period.startDate ?? range.startDate;
  const endDate = period.endDate ?? range.endDate;

  return {
    items: [
      {
        key: "received",
        label: `Received ${dayLabel(startDate)} – ${dayLabel(endDate)}`,
        amount: summary.totalReceived,
        // Growth reads best against the previous period, but the API leaves it
        // null when there is nothing to compare against; then the receipt spread
        // is the more useful second line.
        note:
          summary.growthPercent === null
            ? `${summary.receiptCount} receipts · ${summary.payerCount} parties`
            : `${summary.growthPercent > 0 ? "+" : ""}${summary.growthPercent}% vs previous period`,
        tone: "in",
      },
      {
        key: "waiting",
        label: "Waiting to collect",
        amount: waiting.totalAmount,
        note: `${waiting.parties} parties · avg ₹${waiting.avgPerParty}`,
        tone: "waiting",
      },
      {
        key: "overdue",
        label: `Overdue > ${overdue.thresholdDays} days`,
        amount: overdue.totalAmount,
        note: `${overdue.parties} parties${overdue.topParty ? " · " : ""}`,
        noteHighlight: overdue.topParty ? `${overdue.topParty.name} top` : "",
        tone: "overdue",
      },
    ],
  };
};
